const { prisma } = require('../config/db')

function presenter(moyen) {
  const details = moyen.details && typeof moyen.details === 'object' ? moyen.details : {}
  return {
    id_moyen_paiement: moyen.id_moyen_paiement,
    type: moyen.type,
    nom: details.nom || moyen.type,
    fournisseur: details.fournisseur || null,
    instructions: details.instructions || null,
    actif: moyen.actif,
    date_ajout: moyen.date_ajout,
    date_desactivation: moyen.date_desactivation,
    nombre_paiements: moyen._count?.paiements || 0,
  }
}

const moyenPaiementController = {
  async lister(req, res) {
    try {
      const moyens = await prisma.moyens_paiement.findMany({
        orderBy: [{ actif: 'desc' }, { date_ajout: 'desc' }],
        include: { _count: { select: { paiements: true } } },
      })
      return res.status(200).json({ success: true, message: 'Moyens de paiement récupérés.', data: moyens.map(presenter), errors: null })
    } catch (error) {
      console.error('[moyensPaiement.lister]', error)
      return res.status(500).json({ success: false, message: 'Erreur serveur.', data: null, errors: null })
    }
  },

  async creer(req, res) {
    try {
      const { type, nom, fournisseur, instructions } = req.body
      const doublon = await prisma.moyens_paiement.findFirst({
        where: { type, details: { path: ['nom'], equals: nom } },
        select: { id_moyen_paiement: true },
      })
      if (doublon) {
        return res.status(409).json({ success: false, message: 'Un moyen de paiement portant ce nom existe déjà.', data: null, errors: null })
      }
      const moyen = await prisma.moyens_paiement.create({
        data: {
          type,
          details: { nom, fournisseur: fournisseur || null, instructions: instructions || null },
        },
        include: { _count: { select: { paiements: true } } },
      })
      return res.status(201).json({ success: true, message: 'Moyen de paiement créé.', data: presenter(moyen), errors: null })
    } catch (error) {
      console.error('[moyensPaiement.creer]', error)
      return res.status(500).json({ success: false, message: 'Erreur serveur.', data: null, errors: null })
    }
  },

  async supprimer(req, res) {
    try {
      const moyen = await prisma.moyens_paiement.findUnique({
        where: { id_moyen_paiement: req.params.id },
        include: { _count: { select: { paiements: true } } },
      })
      if (!moyen) return res.status(404).json({ success: false, message: 'Moyen de paiement introuvable.', data: null, errors: null })
      if (moyen._count.paiements > 0) {
        return res.status(409).json({
          success: false,
          message: `Suppression impossible : ce moyen est lié à ${moyen._count.paiements} paiement(s).`,
          data: null,
          errors: { code: 'DEPENDENCY_CONFLICT' },
        })
      }
      await prisma.moyens_paiement.delete({ where: { id_moyen_paiement: req.params.id } })
      return res.status(200).json({ success: true, message: 'Moyen de paiement supprimé.', data: null, errors: null })
    } catch (error) {
      console.error('[moyensPaiement.supprimer]', error)
      return res.status(500).json({ success: false, message: 'Erreur serveur.', data: null, errors: null })
    }
  },
}

module.exports = moyenPaiementController
