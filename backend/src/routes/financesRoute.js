const express              = require('express')
const { authenticate }     = require('../middlewares/authenticate')
const { can }              = require('../middlewares/authorize')
const financesController   = require('../controllers/financesController')
const supportController    = require('../controllers/supportController')

const router = express.Router()

router.use(authenticate)

// ── Finances ──────────────────────────────────────────────────
router.get('/kpis',            can('finances:lire'),        financesController.kpis)
router.get('/transactions',    can('finances:lire'),        financesController.transactions)


module.exports = router;