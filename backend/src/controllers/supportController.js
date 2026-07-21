
const {prisma} = require('../config/db')

const SUJETS = ['probleme_technique', 'question_sur_une_course', 'reclamation', 'autre']

function estAdmin(req) {
  const roles = req.user?.roles || req.user?.utilisateur_role?.map((r) => r.role) || []
  return roles.some((role) => ['admin', 'super_admin'].includes(role))
}

async function participantsSupport(client, idUtilisateur) {
  const admins = await client.utilisateur_role.findMany({
    where: { role: { in: ['admin', 'super_admin'] }, actif: true },
    select: { id_utilisateur: true },
  })
  return [...new Set([idUtilisateur, ...admins.map((a) => a.id_utilisateur)])]
}

async function assurerConversation(client, ticket) {
  const participants = await participantsSupport(client, ticket.id_utilisateur)
  let conversation = await client.conversation.findUnique({
    where: { id_ticket: ticket.id_ticket },
    select: { id_conversation: true },
  })

  if (!conversation) {
    conversation = await client.conversation.create({
      data: { id_ticket: ticket.id_ticket },
      select: { id_conversation: true },
    })
  }

  await client.conversation_participant.createMany({
    data: participants.map((id_utilisateur) => ({
      id_conversation: conversation.id_conversation,
      id_utilisateur,
    })),
    skipDuplicates: true,
  })
  return conversation.id_conversation
}

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
    const page = Number.parseInt(req.query.page, 10) || 1
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 100)
    const { search = '', statut = '' } = req.query
    const skip = (page - 1) * limit

    // C'est l'admin qui voit tout ; tout autre utilisateur ne voit que ses tickets
    const isAdmin = estAdmin(req)
    const whereOwnership = isAdmin ? {} : { id_utilisateur: req.user.id_utilisateur }

    const where = {
      ...whereOwnership,
      ...(statut && { statut }),
      ...(search && {
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          ...(SUJETS.includes(search.toLowerCase()) ? [{ sujet: search.toLowerCase() }] : []),
          { utilisateur: { OR: [
            { nom:    { contains: search, mode: 'insensitive' } },
            { prenom: { contains: search, mode: 'insensitive' } },
          ]}},
        ],
      }),
    }

    const [tickets, total, statsGroup] = await prisma.$transaction([
      prisma.ticket.findMany({
        where, skip, take: limit,
        orderBy: { date_creation: 'desc' },
        include: { utilisateur: { select: { nom: true, prenom: true } } },
      }),
      prisma.ticket.count({ where }),
      prisma.ticket.groupBy({
        by: ['statut'],
        where: whereOwnership,
        _count: { _all: true },
      }),
    ])

    const data = tickets.map(({ utilisateur, ...t }) => ({
      ...t,
      utilisateur_nom:    utilisateur.nom,
      utilisateur_prenom: utilisateur.prenom,
    }))

    return res.status(200).json({
      success: true,
      message: 'Liste des tickets récupérée',
      data: {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        stats: {
          total: statsGroup.reduce((sum, item) => sum + item._count._all, 0),
          ouverts: statsGroup.find((item) => item.statut === 'ouvert')?._count._all || 0,
          en_cours: statsGroup.find((item) => item.statut === 'en_cours')?._count._all || 0,
          resolus: statsGroup.find((item) => item.statut === 'resolu')?._count._all || 0,
          fermes: statsGroup.find((item) => item.statut === 'ferme')?._count._all || 0,
        },
      },
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
        conversation: { select: { id_conversation: true } },
      },
    })

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket introuvable', data: null, errors: null })
    }

    // Anti-IDOR : un non-admin ne voit que ses propres tickets
    const isAdmin = estAdmin(req)
    if (!isAdmin && ticket.id_utilisateur !== req.user.id_utilisateur) {
      return res.status(404).json({ success: false, message: 'Ticket introuvable', data: null, errors: null })
    }

    const idConversation = ticket.conversation?.id_conversation
      || await assurerConversation(prisma, ticket)
    const { utilisateur, conversation, ...rest } = ticket
    return res.status(200).json({
      success: true,
      message: 'Ticket récupéré',
      data: {
        ...rest,
        utilisateur_nom:       utilisateur.nom,
        utilisateur_prenom:    utilisateur.prenom,
        utilisateur_email:     utilisateur.email,
        utilisateur_telephone: utilisateur.numero_telephone,
        id_conversation: idConversation,
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
    const { sujet, description, id_trajet, id_paiement, id_location, priorite = 'normale' } = req.body

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

    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          id_utilisateur,
          sujet,
          description,
          priorite,
          id_trajet: id_trajet ?? null,
          id_paiement: id_paiement ?? null,
          id_location: id_location ?? null,
          eligible_remboursement: false,
        },
      })
      const idConversation = await assurerConversation(tx, created)
      const admins = await tx.utilisateur_role.findMany({
        where: { role: { in: ['admin', 'super_admin'] }, actif: true },
        select: { id_utilisateur: true },
      })
      if (admins.length) {
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            id_utilisateur: admin.id_utilisateur,
            type: 'support_ticket',
            titre: 'Nouveau ticket support',
            contenu: `Un nouveau ticket « ${sujet} » a été créé.`,
            id_objet_lie: created.id_ticket,
          })),
        })
      }
      return { ...created, id_conversation: idConversation }
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
      const { statut, note_resolution } = req.body

      if (['resolu', 'ferme'].includes(statut) && !note_resolution?.trim()) {
        return res.status(422).json({
          success: false,
          message: 'Une note de résolution est requise pour résoudre ou fermer un ticket.',
        })
      }

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

      const ticket = await prisma.$transaction(async (tx) => {
        const updated = await tx.ticket.update({
          where: { id_ticket: req.params.id },
          data: {
            statut,
            date_resolution: ['resolu', 'ferme'].includes(statut) ? new Date() : null,
            note_resolution: ['resolu', 'ferme'].includes(statut) ? note_resolution.trim() : null,
          },
        })
        await tx.notification.create({
          data: {
            id_utilisateur: updated.id_utilisateur,
            type: 'support_statut',
            titre: 'Mise à jour de votre ticket',
            contenu: `Votre ticket est maintenant « ${statut} ».`,
            id_objet_lie: updated.id_ticket,
          },
        })
        return updated
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

  async updatePriorite(req, res) {
    try {
      const ticket = await prisma.ticket.update({
        where: { id_ticket: req.params.id },
        data: { priorite: req.body.priorite },
      })
      return res.status(200).json({
        success: true,
        message: 'Priorité mise à jour',
        data: ticket,
        errors: null,
      })
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Ticket introuvable' })
      }
      console.error('[support.updatePriorite]', err)
      return res.status(500).json({ success: false, message: 'Erreur serveur' })
    }
  },
}

module.exports = supportController ;
