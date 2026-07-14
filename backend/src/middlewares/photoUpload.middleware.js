/**
 * MIDDLEWARES/PHOTOUPLOAD.MIDDLEWARE.JS
 * Multer configuration for photo uploads (optimized for gallery management)
 *
 * Supports owner types: vehicule, utilisateur, journal_parking
 * (Note: maintenance uses mouvement_photo model instead)
 *
 * Differences from document uploads:
 * - Images only (no PDF, video, audio)
 * - Smaller file size limit (10 MB vs 50 MB)
 * - More files allowed per request (10 vs 5)
 * - Optimized for gallery/carousel scenarios
 * - Metadata: ordre (sort), is_principale (cover), legende (caption)
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_TEMP_DIR = process.env.UPLOAD_PHOTO_TEMP_DIR || './uploads/photos/temp';
const MAX_FILE_SIZE_BYTES = parseInt(process.env.MAX_PHOTO_SIZE_BYTES || '10485760', 10); // 10 MB default

// Ensure temp directory exists with 700 permissions
if (!fs.existsSync(UPLOAD_TEMP_DIR)) {
  fs.mkdirSync(UPLOAD_TEMP_DIR, { recursive: true, mode: 0o700 });
}

// Whitelist MIME types: IMAGES ONLY (jpeg, png, webp, gif, heic)
const ALLOWED_MIME_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

// Multer diskStorage: write to temp folder, filename = UUID
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const filename = uuidv4();
    cb(null, filename);
  }
});

// File filter: check MIME type from client
const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES[file.mimetype]) {
    const err = new Error(`MIME type not allowed: ${file.mimetype}`);
    err.code = 'INVALID_MIME_TYPE';
    return cb(err, false);
  }
  cb(null, true);
};

// Multer instance with limits optimized for photo galleries
const uploadPhoto = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES, // 10 MB per image
    files: 10, // Allow 10 images per request (for batch gallery uploads)
    fields: 50,
    fieldSize: 100 * 1024, // 100 KB per field
  }
});

module.exports = {
  uploadPhoto,
  ALLOWED_MIME_TYPES,
  UPLOAD_TEMP_DIR,
  MAX_FILE_SIZE_BYTES,
};
