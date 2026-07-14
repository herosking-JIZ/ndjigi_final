const GestionnaireService = require('../services/gestionnaireService')
const { prisma } = require('../config/db')

const GestionnaireController = {
  /**
   * GET /gestionnaire/me/parking
   * Récupère le parking assigné au gestionnaire authentifié
   *
   * Auth: Bearer token (utilisateur authentifié)
   * Authorization: utilisateur doit avoir le rôle "gestionnaire"
   *
   * Response:
   *   200: { success: true, data: { id_parking, nom, adresse } }
   *   404: Aucun parking assigné
   *   500: Erreur serveur
   */
  async getMyParking(req, res) {
    try {
      const userId = req.user?.id_utilisateur

      // Validation
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié.',
          data: null,
          errors: null
        })
      }

      // Récupérer le parking assigné
      const gestionnaire = await prisma.gestionnaire_parking.findFirst({
        where: {
          id_gestionnaire: userId
        },
        select: {
          id_gestionnaire: true,
          id_parking: true,
          parking: {
            select: {
              id_parking: true,
              nom: true,
              adresse: true,
              ville: true,
              capacite_totale: true,
              capacite_occupee: true
            }
          }
        }
      })

      // Si aucun parking assigné
      if (!gestionnaire || !gestionnaire.parking) {
        return res.status(404).json({
          success: false,
          message: 'Aucun parking assigné à ce gestionnaire.',
          data: null,
          errors: { code: 'NO_PARKING_ASSIGNED' }
        })
      }

      // Retourner les infos du parking
      return res.status(200).json({
        success: true,
        message: 'Parking du gestionnaire récupéré.',
        data: {
          id_parking: gestionnaire.parking.id_parking,
          nom: gestionnaire.parking.nom,
          adresse: gestionnaire.parking.adresse,
          ville: gestionnaire.parking.ville,
          capacite_totale: gestionnaire.parking.capacite_totale,
          capacite_occupee: gestionnaire.parking.capacite_occupee
        },
        errors: null
      })
    } catch (error) {
      console.error('❌ GestionnaireController.getMyParking error:', error.message, error.stack)
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération du parking.',
        data: null,
        errors: null
      })
    }
  },

  /**
   * POST /admin/gestionnaires
   * Create a new gestionnaire with invitation email
   */
  async create(req, res) {
    try {
      const { nom, prenom, email, numero_telephone, adresse, id_parking } = req.body
      const adminId = req.user.id_utilisateur

      const result = await GestionnaireService.create(
        { nom, prenom, email, numero_telephone, adresse, id_parking },
        adminId
      )

      res.status(201).json({
        success: true,
        message: 'Gestionnaire créé. Un email d\'activation a été envoyé.',
        data: result,
        errors: null
      })
    } catch (error) {
      if (error.code === 'PARKING_NOT_FOUND') {
        return res.status(400).json({
          success: false,
          message: 'Parking introuvable.',
          data: null,
          errors: { code: 'PARKING_NOT_FOUND', id_parking: req.body.id_parking }
        })
      }
      if (error.code === 'EMAIL_DUPLICATE') {
        return res.status(409).json({
          success: false,
          message: 'Email déjà utilisé.',
          data: null,
          errors: { code: 'EMAIL_DUPLICATE', email: req.body.email }
        })
      }
      if (error.code === 'PHONE_DUPLICATE') {
        return res.status(409).json({
          success: false,
          message: 'Numéro de téléphone déjà utilisé.',
          data: null,
          errors: { code: 'PHONE_DUPLICATE', numero_telephone: req.body.numero_telephone }
        })
      }

      console.error('❌ Gestionnaire creation error:', error.message)
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la création.',
        data: null,
        errors: null
      })
    }
  }
}

module.exports = GestionnaireController
