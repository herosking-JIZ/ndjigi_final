
const {prisma} = require('../config/db')

function joiErrors(error) {
  return error.details.reduce((acc, d) => {
    const key = d.path.join('.') || 'global'
    acc[key] = d.message
    return acc
  }, {})
}

const supportController = {

  // ─── GET /api/support/tickets ─────────────────────────────────

  async list(req, res) {
  try {
    const { page, limit, search, statut } = req.query
    const skip = (page - 1) * limit

    // C'est l'admin qui voit tout ; tout autre utilisateur ne voit que ses tickets
     const isAdmin = req.user?.roles?.includes('admin')
    const whereOwnership = isAdmin ? {} : { id_utilisateur: req.user.id_utilisateur }

    const where = {
      ...whereOwnership,
      ...(statut && { statut }),
      ...(search && {
        // ⚠️ pas de contains sur `sujet` : c'est un enum, Prisma refuse
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { utilisateur: { OR: [
            { nom:    { contains: search, mode: 'insensitive' } },
            { prenom: { contains: search, mode: 'insensitive' } },
          ]}},
        ],
      }),
    }

    const [tickets, total] = await prisma.$transaction([
      prisma.ticket.findMany({
        where, skip, take: limit,
        orderBy: { date_creation: 'desc' },
        include: { utilisateur: { select: { nom: true, prenom: true } } },
      }),
      prisma.ticket.count({ where }),
    ])

    const data = tickets.map(({ utilisateur, ...t }) => ({
      ...t,
      utilisateur_nom:    utilisateur.nom,
      utilisateur_prenom: utilisateur.prenom,
    }))

    return res.status(200).json({
      success: true,
      message: 'Liste des tickets récupérée',
      data: { data, total, page, limit, totalPages: Math.ceil(total / limit) },
      errors: null,
    })
  } catch (err) {
    console.error('[support.list]', err)
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null, errors: null })
  }
},
  // ─── GET /api/support/tickets/:id ────────────────────────────


  async getOne(req, res) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id_ticket: req.params.id },
      include: {
        utilisateur: { select: { nom: true, prenom: true, email: true, numero_telephone: true } },
        trajet: { select: { adresse_depart: true, adresse_arrivee: true, statut: true, tarif_final: true } },
        remboursement: true,
      },
    })

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket introuvable', data: null, errors: null })
    }

    // Anti-IDOR : un non-admin ne voit que ses propres tickets
    const isAdmin = req.user?.roles?.includes('admin')
    if (!isAdmin && ticket.id_utilisateur !== req.user.id_utilisateur) {
      return res.status(404).json({ success: false, message: 'Ticket introuvable', data: null, errors: null })
    }

    const { utilisateur, ...rest } = ticket
    return res.status(200).json({
      success: true,
      message: 'Ticket récupéré',
      data: {
        ...rest,
        utilisateur_nom:       utilisateur.nom,
        utilisateur_prenom:    utilisateur.prenom,
        utilisateur_email:     utilisateur.email,
        utilisateur_telephone: utilisateur.numero_telephone,
      },
      errors: null,
    })
  } catch (err) {
    console.error('[support.getOne]', err)
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null, errors: null })
  }
},
  // ─── POST /api/support/tickets ───────────────────────────────
async create(req, res) {
  try {
    const id_utilisateur = req.user.id_utilisateur
    const { sujet, description, id_trajet, id_paiement, id_location } = req.body

    // .oxor garantit AU PLUS un lien → on vérifie juste son existence
    if (id_trajet) {
      const exists = await prisma.trajet.findUnique({
        where: { id_trajet }, select: { id_trajet: true },
      })
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Trajet introuvable', data: null, errors: null })
      }
    } else if (id_paiement) {
      const exists = await prisma.paiement.findUnique({
        where: { id_paiement }, select: { id_paiement: true },
      })
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Paiement introuvable', data: null, errors: null })
      }
    } else if (id_location) {
      const exists = await prisma.location.findUnique({
        where: { id_location }, select: { id_location: true },
      })
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Location introuvable', data: null, errors: null })
      }
    }
    // si aucun lien → on tombe directement sur la création (ticket autonome)

    const ticket = await prisma.ticket.create({
      data: {
        id_utilisateur,
        sujet,
        description,
        id_trajet:   id_trajet   ?? null,
        id_paiement: id_paiement ?? null,
        id_location: id_location ?? null,
        eligible_remboursement: false,
      },
    })

    return res.status(201).json({
      success: true,
      message: 'Ticket créé avec succès',
      data: ticket,
      errors: null,
    })
  } catch (err) {
    console.error('[support.create]', err)
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null, errors: null })
  }
},
  // ─── PATCH /api/support/tickets/:id/statut ───────────────────
  async updateStatut(req, res) {
    try {
      const { statut } = req.body

      // Vérifier que le ticket existe
      const exists = await prisma.ticket.findUnique({
        where:  { id_ticket: req.params.id },
        select: { id_ticket: true },
      })
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: 'Ticket introuvable',
          data:    null,
          errors:  null,
        })
      }

      const ticket = await prisma.ticket.update({
        where: { id_ticket: req.params.id },
        data:  {
          statut,
          // Horodater la résolution dès qu'on passe en resolu ou ferme
          ...((statut === 'resolu' || statut === 'ferme') && {
            date_resolution: new Date(),
          }),
        },
      })

      return res.status(200).json({
        success: true,
        message: 'Statut mis à jour',
        data:    ticket,
        errors:  null,
      })
    } catch (err) {
      console.error('[support.updateStatut]', err)
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        data:    null,
        errors:  null,
      })
    }
  },

  async marquerEligible(req, res) {
  try {
    const { eligible } = req.body

    const exists = await prisma.ticket.findUnique({
      where: { id_ticket: req.params.id },
      select: { id_ticket: true, statut: true },
    })
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Ticket introuvable', data: null, errors: null })
    }
    if (exists.statut === 'ferme') {
      return res.status(422).json({ success: false, message: "Impossible de modifier l'éligibilité d'un ticket fermé", data: null, errors: null })
    }

    const ticket = await prisma.ticket.update({
      where: { id_ticket: req.params.id },
      data:  { eligible_remboursement: eligible },
    })

    return res.status(200).json({
      success: true,
      message: eligible ? 'Ticket marqué éligible au remboursement' : 'Éligibilité retirée',
      data: ticket,
      errors: null,
    })
  } catch (err) {
    console.error('[support.marquerEligible]', err)
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null, errors: null })
  }
}
}

module.exports = supportController ;