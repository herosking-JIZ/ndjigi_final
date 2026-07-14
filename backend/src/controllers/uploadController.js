const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { fileTypeFromFile } = require('file-type');
const { prisma } = require('../config/db');
const { getStorageProvider } = require('../storage');
const { ALLOWED_MIME_TYPES, UPLOAD_TEMP_DIR, MAX_FILE_SIZE_BYTES } = require('../config/multer.config');

const USER_QUOTA_BYTES = parseInt(process.env.USER_QUOTA_BYTES || '1073741824', 10); // 1 GB default

const uploadController = {
  // POST /documents — upload file (authenticated user)
  async uploadFile(req, res) {
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
          title,
          fileKey,
          mimeType: detectedType,
          fileSize,
          storageHash: hash,
          status: 'PENDING',
          type: req.body.type || 'general', // Keep existing type field for backward compat
          url_fichier: fileKey, // Temp value, updated below
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
      console.error('[uploadController.uploadFile]', error);

      // Rollback DB if needed
      if (documentId) {
        try {
          await prisma.document.delete({
            where: { id_document: documentId },
          });
        } catch (rollbackError) {
          console.error('[uploadController.uploadFile] Rollback failed:', rollbackError);
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
          console.error('[uploadController.uploadFile] Temp cleanup failed:', cleanupError);
        }
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

module.exports = uploadController;
