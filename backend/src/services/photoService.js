/**
 * SERVICES/PHOTOSERVICE.JS
 * Photo management service (upload, gallery, metadata)
 *
 * Handles:
 * - Photo uploads with validation and deduplication
 * - Gallery organization (ordre, is_principale)
 * - Soft delete via deletedAt
 * - Support for multiple owner types (vehicule, utilisateur, journal_parking, maintenance)
 */

const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { fileTypeFromFile } = require('file-type');
const { prisma } = require('../config/db');
const { getStorageProvider } = require('../storage');
const { ALLOWED_MIME_TYPES, UPLOAD_TEMP_DIR, MAX_FILE_SIZE_BYTES } = require('../middlewares/photoUpload.middleware');

// Photo gallery size limits per owner
const PHOTO_LIMITS = {
  vehicule: 50, // 50 photos per vehicle
  utilisateur: 20, // 20 photos per user
  journal_parking: 10, // 10 photos per parking movement
};

// Default quota for all photos per user: 500 MB
const USER_PHOTO_QUOTA_BYTES = parseInt(process.env.USER_PHOTO_QUOTA_BYTES || '524288000', 10);

/**
 * Upload a photo with validation, deduplication, and storage
 *
 * @param {object} params
 * @param {File} params.file - Multer file object
 * @param {string} params.userId - Current user ID (for quota)
 * @param {string} params.ownerType - 'vehicule'|'utilisateur'|'journal_parking'
 * @param {string} [params.ownerId] - ID of owner (vehicule, utilisateur, or mouvement)
 * @param {boolean} [params.isPrincipale=false] - Mark as cover photo
 * @param {number} [params.ordre=0] - Sort order in gallery
 * @param {string} [params.legende] - Caption text (max 255 chars)
 *
 * @returns {Promise<{id_photo, fileKey, ownerType, ordre, isPrincipale}>}
 * @throws {Error} if validation fails
 */
async function uploadPhoto(params) {
  const {
    file,
    userId,
    ownerType,
    ownerId,
    isPrincipale = false,
    ordre = 0,
    legende = null,
  } = params;

  let tempPath = null;
  let photoId = null;

  try {
    // Step 1: Validate input
    if (!file) throw new Error('No file uploaded.');
    if (!['vehicule', 'utilisateur', 'journal_parking'].includes(ownerType)) {
      throw new Error(`Invalid owner_type: ${ownerType}. Valid types: vehicule, utilisateur, journal_parking`);
    }
    if (ownerId && typeof ownerId !== 'string') {
      throw new Error('Invalid ownerId format.');
    }

    tempPath = file.path;

    // Step 2: Check user photo quota
    const userPhotos = await prisma.photo.findMany({
      where: {
        id_utilisateur: userId,
        deletedAt: null,
      },
      select: { fileSize: true },
    });
    const usedBytes = userPhotos.reduce((sum, p) => sum + (p.fileSize || 0n), 0n);
    const fileSize = BigInt(file.size);
    if (usedBytes + fileSize > BigInt(USER_PHOTO_QUOTA_BYTES)) {
      fs.unlinkSync(tempPath);
      throw new Error(
        `User photo quota exceeded. Used: ${usedBytes} bytes, Limit: ${USER_PHOTO_QUOTA_BYTES} bytes.`
      );
    }

    // Step 3: Validate magic bytes
    let detectedType;
    try {
      const fileType = await fileTypeFromFile(tempPath);
      if (!fileType) {
        fs.unlinkSync(tempPath);
        throw new Error('File type could not be detected.');
      }
      detectedType = fileType.mime;
    } catch (error) {
      fs.unlinkSync(tempPath);
      throw new Error(`File type validation failed: ${error.message}`);
    }

    // Step 4: Verify detected MIME is in whitelist (images only)
    if (!ALLOWED_MIME_TYPES[detectedType]) {
      fs.unlinkSync(tempPath);
      throw new Error(`File type not allowed: ${detectedType} (images only)`);
    }

    // Step 5: Verify detected MIME matches client-declared MIME (spoof check)
    if (file.mimetype !== detectedType) {
      fs.unlinkSync(tempPath);
      throw new Error(
        `MIME type mismatch. Client declared: ${file.mimetype}, detected: ${detectedType}`
      );
    }

    // Step 6: Hash file with SHA256 streaming
    const hash = await computeFileHash(tempPath);

    // Step 7: Check deduplication — if same hash+userId+ownerType+ownerId exists and not soft-deleted, reuse
    const existingPhoto = await prisma.photo.findFirst({
      where: {
        id_utilisateur: userId,
        storageHash: hash,
        owner_type: ownerType,
        ...(ownerId && { [ownerTypeToField(ownerType)]: ownerId }),
        deletedAt: null,
      },
    });

    if (existingPhoto) {
      fs.unlinkSync(tempPath);
      return {
        id_photo: existingPhoto.id_photo,
        fileKey: existingPhoto.fileKey,
        ownerType: existingPhoto.owner_type,
        ordre: existingPhoto.ordre,
        isPrincipale: existingPhoto.is_principale,
        duplicate: true,
      };
    }

    // Step 8: Check gallery limit for owner
    if (ownerId) {
      const ownerPhotos = await prisma.photo.findMany({
        where: {
          owner_type: ownerType,
          [ownerTypeToField(ownerType)]: ownerId,
          deletedAt: null,
        },
      });
      const limit = PHOTO_LIMITS[ownerType] || 50;
      if (ownerPhotos.length >= limit) {
        fs.unlinkSync(tempPath);
        throw new Error(
          `Gallery limit reached for ${ownerType}. Maximum: ${limit} photos.`
        );
      }
    }

    // Step 9: Construct fileKey: photos/{ownerType}/{ownerId}/{YYYY-MM}/{uuid}{ext}
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const ext = ALLOWED_MIME_TYPES[detectedType];
    const fileKey = `photos/${ownerType}/${ownerId || 'unlinked'}/${yearMonth}/${uuidv4()}${ext}`;

    // Step 10: Sanitize legende: max 255 chars, alphanumeric + spaces + punctuation
    let sanitizedLegende = legende ? sanitizeCaption(legende).substring(0, 255) : null;

    // Step 11: Create photo in DB
    const photo = await prisma.photo.create({
      data: {
        id_utilisateur: userId,
        owner_type: ownerType,
        ...(ownerType === 'vehicule' && ownerId && { id_vehicule: ownerId }),
        ...(ownerType === 'utilisateur' && ownerId && { id_utilisateur: ownerId }),
        ...(ownerType === 'journal_parking' && ownerId && { id_mouvement: ownerId }),
        filename: file.originalname,
        fileKey,
        mimeType: detectedType,
        fileSize,
        storageHash: hash,
        is_principale: isPrincipale,
        ordre,
        legende: sanitizedLegende,
      },
    });

    photoId = photo.id_photo;

    // Step 12: Move file via storage provider
    const storage = getStorageProvider();
    try {
      await storage.save(tempPath, fileKey);
      tempPath = null; // Mark as moved
    } catch (error) {
      // Rollback DB if storage fails
      await prisma.photo.delete({
        where: { id_photo: photoId },
      });
      throw new Error(`Failed to save to storage: ${error.message}`);
    }

    return {
      id_photo: photo.id_photo,
      fileKey: photo.fileKey,
      ownerType: photo.owner_type,
      ordre: photo.ordre,
      isPrincipale: photo.is_principale,
      duplicate: false,
    };
  } catch (error) {
    if (photoId) {
      try {
        await prisma.photo.delete({
          where: { id_photo: photoId },
        });
      } catch (rollbackError) {
        console.error('[photoService.uploadPhoto] Rollback failed:', rollbackError);
      }
    }
    throw error;
  } finally {
    if (tempPath && fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (cleanupError) {
        console.error('[photoService.uploadPhoto] Temp cleanup failed:', cleanupError);
      }
    }
  }
}

/**
 * Update photo metadata (legende, ordre, is_principale)
 *
 * @param {string} photoId - Photo ID
 * @param {string} userId - Current user ID (for permission check)
 * @param {object} updates - { legende?, ordre?, is_principale? }
 * @returns {Promise<object>} Updated photo
 */
async function updatePhotoMetadata(photoId, userId, updates) {
  const photo = await prisma.photo.findUnique({
    where: { id_photo: photoId },
  });

  if (!photo) throw new Error('Photo not found.');
  if (photo.id_utilisateur !== userId) throw new Error('Permission denied.');

  const sanitized = {};
  if (updates.legende !== undefined) {
    sanitized.legende = updates.legende ? sanitizeCaption(updates.legende).substring(0, 255) : null;
  }
  if (updates.ordre !== undefined) {
    sanitized.ordre = Math.max(0, Math.min(1000, parseInt(updates.ordre, 10)));
  }
  if (updates.is_principale !== undefined) {
    sanitized.is_principale = Boolean(updates.is_principale);
  }

  return prisma.photo.update({
    where: { id_photo: photoId },
    data: sanitized,
  });
}

/**
 * Soft delete a photo (set deletedAt)
 *
 * @param {string} photoId - Photo ID
 * @param {string} userId - Current user ID (for permission check)
 * @returns {Promise<object>} Soft-deleted photo
 */
async function deletePhotoSoft(photoId, userId) {
  const photo = await prisma.photo.findUnique({
    where: { id_photo: photoId },
  });

  if (!photo) throw new Error('Photo not found.');
  if (photo.id_utilisateur !== userId) throw new Error('Permission denied.');

  return prisma.photo.update({
    where: { id_photo: photoId },
    data: { deletedAt: new Date() },
  });
}

/**
 * Permanently delete a photo (hard delete) and remove from storage
 *
 * @param {string} photoId - Photo ID
 * @param {string} userId - Current user ID (for permission check)
 * @returns {Promise<void>}
 */
async function deletePhotoPermanent(photoId, userId) {
  const photo = await prisma.photo.findUnique({
    where: { id_photo: photoId },
  });

  if (!photo) throw new Error('Photo not found.');
  if (photo.id_utilisateur !== userId) throw new Error('Permission denied.');

  // Remove from storage
  const storage = getStorageProvider();
  try {
    await storage.delete(photo.fileKey);
  } catch (error) {
    console.error('[photoService.deletePhotoPermanent] Storage delete failed:', error);
    // Don't throw: continue with DB deletion
  }

  // Delete from DB
  await prisma.photo.delete({
    where: { id_photo: photoId },
  });
}

/**
 * Get gallery for owner (paginated, excludes soft-deleted)
 *
 * @param {object} params
 * @param {string} params.ownerType - 'vehicule'|'utilisateur'|'journal_parking'
 * @param {string} params.ownerId - ID of owner
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Photos per page
 * @returns {Promise<{photos: [], total: number, pages: number}>}
 */
async function getGallery(params) {
  const { ownerType, ownerId, page = 1, limit = 20 } = params;

  if (!['vehicule', 'utilisateur', 'journal_parking'].includes(ownerType)) {
    throw new Error(`Invalid owner_type: ${ownerType}. Valid types: vehicule, utilisateur, journal_parking`);
  }

  const where = {
    owner_type: ownerType,
    [ownerTypeToField(ownerType)]: ownerId,
    deletedAt: null,
  };

  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where,
      orderBy: [{ is_principale: 'desc' }, { ordre: 'asc' }, { uploadedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.photo.count({ where }),
  ]);

  return {
    photos,
    total,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Convert ownerType to Prisma field name
 * @private
 */
function ownerTypeToField(ownerType) {
  const mapping = {
    vehicule: 'id_vehicule',
    utilisateur: 'id_utilisateur',
    journal_parking: 'id_mouvement',
  };
  return mapping[ownerType];
}

/**
 * Compute SHA256 hash by streaming
 * @private
 */
async function computeFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

/**
 * Sanitize caption: remove HTML, limit punctuation
 * @private
 */
function sanitizeCaption(caption) {
  return caption
    .replace(/[<>{}]/g, '') // Remove HTML brackets
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

module.exports = {
  uploadPhoto,
  updatePhotoMetadata,
  deletePhotoSoft,
  deletePhotoPermanent,
  getGallery,
  PHOTO_LIMITS,
  USER_PHOTO_QUOTA_BYTES,
};
