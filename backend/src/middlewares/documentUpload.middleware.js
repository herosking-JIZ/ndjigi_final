const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Storage configuration: /backend/storage/documents/{id_utilisateur}/{type}/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../storage/documents')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const userId = req.user?.id_utilisateur || 'unknown'
    const type = req.body?.type || 'unknown'
    const filename = `${userId}_${type}_${Date.now()}${ext}`
    cb(null, filename)
  }
})

// File filter: accept only images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf','image/jpg','image/gif','image/webp','image/svg+xml' ]
  if (!allowedMimes.includes(file.mimetype)) {
    const err = new Error(`Type de fichier non autorisé: ${file.mimetype}`)
    err.code = 'INVALID_MIME_TYPE'
    return cb(err, false)
  }
  cb(null, true)
}

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
})

module.exports = upload
