const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_TEMP_DIR = process.env.UPLOAD_TEMP_DIR || './uploads/temp';
const MAX_FILE_SIZE_BYTES = parseInt(process.env.MAX_FILE_SIZE_BYTES || '52428800', 10); // 50 MB default

// Ensure temp directory exists with 700 permissions
if (!fs.existsSync(UPLOAD_TEMP_DIR)) {
  fs.mkdirSync(UPLOAD_TEMP_DIR, { recursive: true, mode: 0o700 });
}

// Whitelist MIME types: PDF, images (jpeg, png, webp, gif), videos (mp4, webm), audio (mp3, wav)
const ALLOWED_MIME_TYPES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
};

// Multer diskStorage: write to temp folder, filename = UUID without extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_TEMP_DIR);
  },
  filename: (req, file, cb) => {
    // UUID v4 without extension; extension added after magic bytes validation
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

// Multer instance with limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 5,
    fields: 20,
    fieldSize: 100 * 1024, // 100 KB per field
  }
});

module.exports = {
  upload,
  ALLOWED_MIME_TYPES,
  UPLOAD_TEMP_DIR,
  MAX_FILE_SIZE_BYTES,
};
