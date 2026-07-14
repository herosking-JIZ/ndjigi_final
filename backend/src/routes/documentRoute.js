const express = require('express');
const documentController = require('../controllers/documentController');
const { authenticate } = require('../middlewares/authenticate');
const { can, authorize } = require('../middlewares/authorize');
const joiValidate = require('../middlewares/validate.middleware');
const { upload } = require('../config/multer.config');
const uploadRateLimiter = require('../middlewares/uploadRateLimit');
const { partnerDocumentUploadSchema } = require('../validators/gestionnaireValidation');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin'), documentController.list)
router.patch('/:id/valider', authorize('admin'), documentController.valider)
router.patch('/:id/rejeter', authorize('admin'), documentController.rejeter)
router.post(
  '/',
  uploadRateLimiter,
  upload.single('fichier'),
  joiValidate({ body: partnerDocumentUploadSchema }),
  can('profil:modifier'),
  documentController.uploadDocument
)
router.get('/me', can('profil:lire'), documentController.mesDocuments)
router.get('/:id/fichier', documentController.serveFile)

module.exports = router;
