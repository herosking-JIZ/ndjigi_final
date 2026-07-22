const express = require('express')
const { authorize } = require('../middlewares/authorize')
const joiValidate = require('../middlewares/validate.middleware')
const controller = require('../controllers/moyenPaiementController')
const { idSchema, createSchema } = require('../validators/moyenPaiementValidator')

const router = express.Router()
router.use(authorize('admin'))
router.get('/', controller.lister)
router.post('/', joiValidate({ body: createSchema }), controller.creer)
router.delete('/:id', joiValidate({ params: idSchema }), controller.supprimer)

module.exports = router
