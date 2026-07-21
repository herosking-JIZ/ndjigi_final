const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { fileTypeFromFile } = require('file-type');
const { prisma } = require('../config/db');
const { getStorageProvider } = require('../storage');
const { ALLOWED_MIME_TYPES, UPLOAD_TEMP_DIR, MAX_FILE_SIZE_BYTES } = require('../config/multer.config');

const USER_QUOTA_BYTES = parseInt(process.env.USER_QUOTA_BYTES || '1073741824', 10); // 1 GB default

const documentController = {

  // GET /documents?statut=en_attente  OU  ?statut=valide,rejete
  async list(req, res) {
    try {
      const { statut } = req.query;

      // Construire le filtre statut
      const statutFilter = statut
        ? { statut_verification: { in: statut.split(',') } }
        : {};

      const documents = await prisma.document.findMany({
        where: { ...statutFilter },
        orderBy: { date_soumission: 'desc' },
        include: {
          utilisateur: {
            select: { nom: true, prenom: true }
          }
        }
      });

      // Aplatir utilisateur_nom / utilisateur_prenom comme le front l'attend
      const data = documents.map((d) => ({
        id_document:          d.id_document,
        id_utilisateur:       d.id_utilisateur,
        utilisateur_nom:      d.utilisateur.nom,
        utilisateur_prenom:   d.utilisateur.prenom,
        type:                 d.type,
        url_fichier:          d.url_fichier,
        statut_verification:  d.statut_verification,
        date_soumission:      d.date_soumission,
        date_expiration:      d.date_expiration ?? null,
        motif_rejet:          d.motif_rejet ?? null,
      }));

      return res.status(200).json({
        success: true,
        message: 'Documents récupérés.',
        data,
        errors: null,
      });
    } catch (error) {
      console.error('[document.list]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        data: null,
        errors: error.message,
      });
    }
  },

  // PATCH /documents/:id/valider
  async valider(req, res) {
    try {
      const { id } = req.params;

      await prisma.document.update({
        where: { id_document: id },
        data:  { statut_verification: 'valide', motif_rejet: null },
      });

      return res.status(200).json({
        success: true,
        message: 'Document validé.',
        data: null,
        errors: null,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Document introuvable.',
          data: null,
          errors: { code: 'DOCUMENT_NOT_FOUND' },
        });
      }
      console.error('[document.valider]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        data: null,
        errors: error.message,
      });
    }
  },

  // PATCH /documents/:id/rejeter  — body: { motif: string }
  async rejeter(req, res) {
    try {
      const { id }    = req.params;
      const { motif } = req.body;

      if (!motif || !motif.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Le motif de rejet est obligatoire.',
          data: null,
          errors: { field: 'motif', code: 'MISSING_MOTIF' },
        });
      }

      await prisma.document.update({
        where: { id_document: id },
        data:  { statut_verification: 'rejete', motif_rejet: motif.trim() },
      });

      return res.status(200).json({
        success: true,
        message: 'Document rejeté.',
        data: null,
        errors: null,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Document introuvable.',
          data: null,
          errors: { code: 'DOCUMENT_NOT_FOUND' },
        });
      }
      console.error('[document.rejeter]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        data: null,
        errors: error.message,
      });
    }
  },

  // POST /documents  — upload new file (production-ready with validation, quota, dedup)
  async uploadDocument(req, res) {
    let tempPath = null;
    let documentId = null;

    try {
      // Step 1: Verify file exists
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded.',
          errors: { code: 'NO_FILE_UPLOADED' },
        });
      }

      const userId = req.user.id_utilisateur;
      tempPath = req.file.path;

      // Step 1bis: Si le document est rattaché à un véhicule (carte grise, assurance),
      // vérifier que ce véhicule appartient bien à l'utilisateur connecté.
      const { id_vehicule, date_expiration } = req.body;
      if (id_vehicule) {
        const vehicule = await prisma.vehicule.findUnique({ where: { id_vehicule } });
        if (!vehicule || vehicule.id_proprietaire !== userId) {
          fs.unlinkSync(tempPath);
          return res.status(403).json({
            success: false,
            message: 'Ce véhicule ne vous appartient pas.',
            errors: { code: 'VEHICULE_NOT_OWNED' },
          });
        }
      }

      // Step 2: Check user quota (sum of non-deleted document fileSize)
      const userDocs = await prisma.document.findMany({
        where: {
          id_utilisateur: userId,
          deletedAt: null,
        },
        select: { fileSize: true },
      });
      const usedBytes = userDocs.reduce((sum, doc) => sum + (doc.fileSize || 0n), 0n);
      const fileSize = BigInt(req.file.size);
      if (usedBytes + fileSize > BigInt(USER_QUOTA_BYTES)) {
        fs.unlinkSync(tempPath);
        return res.status(413).json({
          success: false,
          message: `User quota exceeded. Used: ${usedBytes} bytes, Limit: ${USER_QUOTA_BYTES} bytes.`,
          errors: { code: 'QUOTA_EXCEEDED' },
        });
      }

      // Step 3: Validate magic bytes
      let detectedType;
      try {
        const fileType = await fileTypeFromFile(tempPath);
        if (!fileType) {
          fs.unlinkSync(tempPath);
          return res.status(400).json({
            success: false,
            message: 'File type could not be detected.',
            errors: { code: 'UNKNOWN_FILE_TYPE' },
          });
        }
        detectedType = fileType.mime;
      } catch (error) {
        fs.unlinkSync(tempPath);
        return res.status(400).json({
          success: false,
          message: 'Failed to validate file type.',
          errors: { code: 'FILE_TYPE_VALIDATION_FAILED' },
        });
      }

      // Step 4: Verify detected MIME is in whitelist
      if (!ALLOWED_MIME_TYPES[detectedType]) {
        fs.unlinkSync(tempPath);
        return res.status(400).json({
          success: false,
          message: `File type not allowed: ${detectedType}`,
          errors: { code: 'FILE_TYPE_NOT_ALLOWED' },
        });
      }

      // Step 5: Verify detected MIME matches client-declared MIME (spoof check)
      if (req.file.mimetype !== detectedType) {
        fs.unlinkSync(tempPath);
        return res.status(400).json({
          success: false,
          message: `MIME type mismatch. Client declared: ${req.file.mimetype}, detected: ${detectedType}`,
          errors: { code: 'MIME_MISMATCH' },
        });
      }

      // Step 6: Hash file with SHA256 streaming
      const hash = await computeFileHash(tempPath);

      // Step 7: Check deduplication — if same hash+userId exists and not soft-deleted, return it
      const existingDoc = await prisma.document.findFirst({
        where: {
          id_utilisateur: userId,
          storageHash: hash,
          type: req.body.type || 'general',
          deletedAt: null,
        },
      });

      if (existingDoc) {
        fs.unlinkSync(tempPath);
        return res.status(200).json({
          success: true,
          message: 'File already exists (duplicate).',
          data: {
            id_document: existingDoc.id_document,
            fileUrl: `/documents/${existingDoc.id_document}/fichier`,
            duplicate: true,
          },
        });
      }

      // Step 8: Construct fileKey: YYYY-MM/{userId}/{uuid}{ext}
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const ext = ALLOWED_MIME_TYPES[detectedType];
      const fileKey = `${yearMonth}/${userId}/${uuidv4()}${ext}`;

      // Step 9: Sanitize title: alphanum + spaces + ".-_", max 200 chars
      let title = req.body.title || req.file.originalname || 'Untitled';
      title = sanitizeTitle(title);
      if (title.length > 200) {
        title = title.substring(0, 200);
      }

      // Step 10: Create document in DB with status PENDING
      const document = await prisma.document.create({
        data: {
          id_utilisateur: userId,
          id_vehicule: id_vehicule || null,
          date_expiration: date_expiration ? new Date(date_expiration) : null,
          title,
          fileKey,
          mimeType: detectedType,
          fileSize,
          storageHash: hash,
          status: 'PENDING',
          type: req.body.type || 'general',
          url_fichier: fileKey,
        },
      });

      documentId = document.id_document;

      // Step 11: Move file via storage provider
      const storage = getStorageProvider();
      try {
        await storage.save(tempPath, fileKey);
        tempPath = null; // Mark as moved
      } catch (error) {
        // Rollback DB if storage fails
        await prisma.document.delete({
          where: { id_document: documentId },
        });
        return res.status(500).json({
          success: false,
          message: 'Failed to save file to storage.',
          errors: { code: 'STORAGE_ERROR', details: error.message },
        });
      }

      // Step 12: Update document status to READY
      const updatedDoc = await prisma.document.update({
        where: { id_document: documentId },
        data: { status: 'READY' },
      });

      // Step 13: Return fileUrl (never internal path)
      return res.status(201).json({
        success: true,
        message: 'File uploaded successfully.',
        data: {
          id_document: updatedDoc.id_document,
          fileUrl: `/documents/${updatedDoc.id_document}/fichier`,
          duplicate: false,
        },
      });
    } catch (error) {
      console.error('[documentController.uploadDocument]', error);

      // Rollback DB if needed
      if (documentId) {
        try {
          await prisma.document.delete({
            where: { id_document: documentId },
          });
        } catch (rollbackError) {
          console.error('[documentController.uploadDocument] Rollback failed:', rollbackError);
        }
      }

      return res.status(500).json({
        success: false,
        message: 'Server error.',
        errors: { code: 'INTERNAL_ERROR', details: error.message },
      });
    } finally {
      // Cleanup temp file if still present
      if (tempPath && fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch (cleanupError) {
          console.error('[documentController.uploadDocument] Temp cleanup failed:', cleanupError);
        }
      }
    }
  },

  // GET /documents/me  — mes documents (utilisateur connecté, conservé)
  async mesDocuments(req, res) {
    try {
      const id_utilisateur = req.user.id_utilisateur;
      const { id_vehicule } = req.query;

      const documents = await prisma.document.findMany({
        where:   { id_utilisateur, ...(id_vehicule ? { id_vehicule } : {}) },
        orderBy: { date_soumission: 'desc' },
      });

      return res.status(200).json({
        success: true,
        message: 'Documents récupérés.',
        data: documents,
        errors: null,
      });
    } catch (error) {
      console.error('[document.mesDocuments]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        data: null,
        errors: error.message,
      });
    }
  },

  // GET /documents/:id/fichier — serve file to authenticated owner
  async serveFile(req, res) {
    try {
      const { id } = req.params;
      const { inline } = req.query;
      const userId = req.user.id_utilisateur;

      // Parse id as UUID, return 400 if invalid
      if (!id || typeof id !== 'string' || id.length !== 36) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document ID format.',
          errors: { code: 'INVALID_ID_FORMAT' },
        });
      }

      // Lookup document
      const document = await prisma.document.findUnique({
        where: { id_document: id },
      });

      // Return 404 if document absent, soft-deleted, or not READY
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found.',
          errors: { code: 'DOCUMENT_NOT_FOUND' },
        });
      }

      if (document.deletedAt) {
        return res.status(404).json({
          success: false,
          message: 'Document not found.',
          errors: { code: 'DOCUMENT_NOT_FOUND' },
        });
      }

      if (document.status !== 'READY') {
        return res.status(400).json({
          success: false,
          message: 'Document is not ready for download.',
          errors: { code: 'DOCUMENT_NOT_READY' },
        });
      }

      // Verify ownership (admin can review any document)
      const rolesUser = req.user.utilisateur_role.map(r => r.role);
      if (document.id_utilisateur !== userId && !rolesUser.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied.',
          errors: { code: 'FORBIDDEN' },
        });
      }

      // Get storage provider and stream file
      const { getStorageProvider } = require('../storage');
      const storage = getStorageProvider();

      let readStream;
      try {
        readStream = await storage.getReadStream(document.fileKey);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'File not found in storage.',
          errors: { code: 'FILE_NOT_FOUND' },
        });
      }

      // Determine Content-Disposition based on ?inline parameter
      const shouldDisplayInline = inline === 'true';
      const dispositionValue = shouldDisplayInline
        ? `inline; filename="${encodeURIComponent(document.title || 'document')}"`
        : `attachment; filename="${encodeURIComponent(document.title || 'document')}"`;

      // Set response headers
      res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
      // Convert BigInt to string for Content-Length header
      res.setHeader('Content-Length', (document.fileSize || 0n).toString());
      res.setHeader('Content-Disposition', dispositionValue);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'");

      // Handle stream errors
      readStream.on('error', (error) => {
        console.error('[documentController.serveFile] Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error reading file.',
            errors: { code: 'FILE_READ_ERROR' },
          });
        }
      });

      // Pipe file to response
      readStream.pipe(res);
    } catch (error) {
      console.error('[documentController.serveFile]', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Server error.',
          errors: { code: 'INTERNAL_ERROR' },
        });
      }
    }
  },
};

// Helper: Compute SHA256 hash by streaming
async function computeFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

// Helper: Sanitize title to alphanum + spaces + ".-_"
function sanitizeTitle(title) {
  return title.replace(/[^a-zA-Z0-9\s.\-_]/g, '').trim();
}

module.exports = documentController;