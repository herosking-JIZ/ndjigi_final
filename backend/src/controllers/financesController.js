const {prisma} = require('../config/db')
const { listTransactionsSchema } = require('../validators/financesValidation')

// ── Helpers ────────────────────────────────────────────────────

function joiErrors(error) {
  return error.details.reduce((acc, d) => {
    const key = d.path.join('.') || 'global'
    acc[key] = d.message
    return acc
  }, {})
}

/**
 * Construit la description lisible d'une transaction
 * à partir des données jointes (trajet, remboursement, etc.)
 */
function buildDescription(paiement) {
  switch (paiement.type) {
    case 'PAIEMENT_TRAJET': {
      // On cherche le trajet via id_objet_lie
      if (paiement._trajet) {
        return `Course ${paiement._trajet.adresse_depart} → ${paiement._trajet.adresse_arrivee}`
      }
      return 'Paiement trajet'
    }
    case 'COMMISSION':
      return 'Commission plateforme'
    case 'REMBOURSEMENT': {
      if (paiement._remboursement) {
        return `Remboursement – ${paiement._remboursement.motif}`
      }
      return 'Remboursement'
    }
    case 'RECHARGE_SOLDE':
      return 'Recharge portefeuille'
    case 'RETRAIT':
      return 'Retrait portefeuille'
    default:
      return 'Transaction'
  }
}

/**
 * Normalise le type Prisma vers le type attendu par le frontend
 * TransactionType = 'course' | 'location' | 'commission' | 'remboursement' | 'depot' | 'retrait'
 */
function normalizeType(type) {
  const map = {
    PAIEMENT_TRAJET: 'course',
    COMMISSION:      'commission',
    REMBOURSEMENT:   'remboursement',
    RECHARGE_SOLDE:  'depot',
    RETRAIT:         'retrait',
  }
  return map[type] ?? 'course'
}

// ── Controllers ────────────────────────────────────────────────

const financesController = {

  // GET /api/v1/finances/kpis
  async kpis(req, res) {
    try {
      const PLATEFORME_WALLET_ID = process.env.PLATEFORME_WALLET_ID

      // Toutes les agrégations en parallèle
      const [
        commissionsAgg,
        volumeCoursesAgg,
        remboursementsAgg,
        walletPlateforme,
      ] = await Promise.all([

        // 1. Commissions totales collectées (paiements de type COMMISSION complétés)
        prisma.paiement.aggregate({
          _sum: { montant: true },
          where: {
            type:   'COMMISSION',
            statut: 'complete',
          },
        }),

        // 2. Volume total des courses (tarif_final de tous les trajets terminés)
        prisma.trajet.aggregate({
          _sum: { tarif_final: true },
          where: { statut: 'termine' },
        }),

        // 3. Total des remboursements traités
        prisma.remboursement.aggregate({
          _sum: { montant: true },
          where: { statut: 'traite' },
        }),

        // 4. Solde actuel du portefeuille plateforme
        PLATEFORME_WALLET_ID
          ? prisma.portefeuille.findUnique({
              where:  { id_portefeuille: PLATEFORME_WALLET_ID },
              select: { solde: true },
            })
          : Promise.resolve(null),
      ])

      const kpis = {
        commissions_totales:      Number(commissionsAgg._sum.montant      ?? 0),
        volume_courses:           Number(volumeCoursesAgg._sum.tarif_final ?? 0),
        remboursements:           Number(remboursementsAgg._sum.montant    ?? 0),
        taux_commission:          15, // fixe pour l'instant, configurable plus tard
        solde_wallet_plateforme:  Number(walletPlateforme?.solde           ?? 0),
      }

      return res.status(200).json({
        success: true,
        message: 'KPIs financiers récupérés',
        data:    kpis,
        errors:  null,
      })
    } catch (err) {
      console.error('[finances.kpis]', err)
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        data:    null,
        errors:  null,
      })
    }
  },

  // GET /api/v1/finances/transactions
  async transactions(req, res) {
    const { error, value } = listTransactionsSchema.validate(req.query, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres invalides',
        data:    null,
        errors:  joiErrors(error),
      })
    }

    try {
      const { page, limit, search, type } = value
      const skip = (page - 1) * limit

      // ── Construction du filtre WHERE ──────────────────────────
      const where = {
        // Exclure les transactions de l'utilisateur système
        id_utilisateur: { not: process.env.PLATEFORME_USER_ID },

        ...(type && type !== '' && { type }),

        ...(search && search !== '' && {
          OR: [
            {
              utilisateur: {
                OR: [
                  { nom:    { contains: search, mode: 'insensitive' } },
                  { prenom: { contains: search, mode: 'insensitive' } },
                  { email:  { contains: search, mode: 'insensitive' } },
                ],
              },
            },
            {
              reference_transaction: { contains: search, mode: 'insensitive' },
            },
          ],
        }),
      }

      // ── Requêtes en parallèle ─────────────────────────────────
      const [paiements, total] = await Promise.all([
        prisma.paiement.findMany({
          where,
          skip,
          take:    limit,
          orderBy: { date_paiement: 'desc' },
          include: {
            utilisateur: {
              select: { nom: true, prenom: true, email: true },
            },
          },
        }),
        prisma.paiement.count({ where }),
      ])

      // ── Enrichissement : récupérer trajets et remboursements liés ──
      // On groupe les id_objet_lie par type pour faire le minimum de requêtes
      const idsTrajets = paiements
        .filter((p) => p.type === 'PAIEMENT_TRAJET' && p.id_objet_lie)
        .map((p) => p.id_objet_lie)

      const idsRemboursements = paiements
        .filter((p) => p.type === 'REMBOURSEMENT' && p.id_objet_lie)
        .map((p) => p.id_objet_lie)

      // Fetch trajets et remboursements en parallèle si nécessaire
      const [trajets, remboursements] = await Promise.all([
        idsTrajets.length > 0
          ? prisma.trajet.findMany({
              where:  { id_trajet: { in: idsTrajets } },
              select: { id_trajet: true, adresse_depart: true, adresse_arrivee: true },
            })
          : Promise.resolve([]),

        idsRemboursements.length > 0
          ? prisma.remboursement.findMany({
              where:  { id_remboursement: { in: idsRemboursements } },
              select: { id_remboursement: true, motif: true },
            })
          : Promise.resolve([]),
      ])

      // Index par id pour lookup O(1)
      const trajetsMap        = Object.fromEntries(trajets.map((t) => [t.id_trajet, t]))
      const remboursementsMap = Object.fromEntries(remboursements.map((r) => [r.id_remboursement, r]))

      // ── Formatage final vers le type Transaction du frontend ──
      const data = paiements.map((p) => {
        const enriched = {
          ...p,
          _trajet:        trajetsMap[p.id_objet_lie]        ?? null,
          _remboursement: remboursementsMap[p.id_objet_lie] ?? null,
        }

        return {
          id_paiement:    p.id_paiement,
          description:    buildDescription(enriched),
          type:           normalizeType(p.type),
          montant:        Number(p.montant),
          statut:         p.statut,
          date_paiement:  p.date_paiement,
          id_utilisateur: p.id_utilisateur,
          // Infos utilisateur en bonus (utiles pour l'admin)
          utilisateur_nom:    p.utilisateur.nom,
          utilisateur_prenom: p.utilisateur.prenom,
          utilisateur_email:  p.utilisateur.email,
        }
      })

      return res.status(200).json({
        success: true,
        message: 'Transactions récupérées',
        data: {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        errors: null,
      })
    } catch (err) {
      console.error('[finances.transactions]', err)
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        data:    null,
        errors:  null,
      })
    }
  },
}

module.exports = financesController