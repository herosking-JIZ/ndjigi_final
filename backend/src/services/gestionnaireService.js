const { prisma } = require('../config/db')
const userProvisioningService = require('./userProvisioningService')
const ProvisioningError = require('../errors/ProvisioningError')

const GestionnaireService = {
  /**
   * Verify invitation token is valid
   * @param {String} token - Invitation token (UUID)
   * @returns {Promise<Object>} User data { email, id_utilisateur, parking_nom }
   * @throws {Object} Error if token invalid or expired
   */
  async verifyToken(token) {
    try {
      if (!token) {
        throw { code: 'INVALID_TOKEN', statusCode: 400 }
      }

      // Find user with valid token
      const user = await prisma.utilisateur.findFirst({
        where: {
          invitation_token: token,
          invitation_token_expire: { gt: new Date() },
          invitation_used_at: null // Token must not have been used yet
        },
        include: {
          gestionnaire: {
            include: {
              parking: {
                select: { nom: true }
              }
            }
          }
        }
      })

      if (!user) {
        throw { code: 'TOKEN_INVALID_OR_EXPIRED', statusCode: 404 }
      }

      // Return user info for activation form
      return {
        email: user.email,
        id_utilisateur: user.id_utilisateur,
        parking_nom: user.gestionnaire?.parking?.nom || null
      }
    } catch (error) {
      // Re-throw with code if it's our custom error
      if (error.code) {
        throw error
      }
      throw { code: 'VERIFY_TOKEN_ERROR', statusCode: 500, details: error.message }
    }
  },

  /**
   * Create a gestionnaire account with temporary password
   * Uses atomic userProvisioningService for Keycloak + PostgreSQL sync
   * @param {Object} data - { nom, prenom, email, numero_telephone, adresse?, id_parking }
   * @param {String} adminId - UUID of admin creating this gestionnaire
   * @returns {Promise<Object>} Created gestionnaire data (id_utilisateur, email, parking)
   * @throws {Object} Error with code property for typed error handling
   */
  async create(data, adminId) {
    // Validate parking exists first
    const parking = await prisma.parking.findUnique({
      where: { id_parking: data.id_parking }
    })

    if (!parking) {
      throw { code: 'PARKING_NOT_FOUND', statusCode: 400 }
    }

    try {
      // Use atomic userProvisioningService
      const newUser = await userProvisioningService.create({
        email: data.email,
        nom: data.nom,
        prenom: data.prenom,
        role: 'gestionnaire',
        numero_telephone: data.numero_telephone,
        adresse: data.adresse || null,
        metadata: { id_parking: data.id_parking },
        sendInvitationEmail: true,
        createdBy: {
          id_utilisateur: adminId,
          role: 'admin'
        }
      })

      console.log(`✅ [GESTIONNAIRE_CREATED] admin=${adminId} gestionnaire=${newUser.id_utilisateur} parking=${data.id_parking}`)

      return {
        id_utilisateur: newUser.id_utilisateur,
        email: newUser.email,
        parking: {
          id_parking: parking.id_parking,
          nom: parking.nom
        }
      }
    } catch (error) {
      // Convert ProvisioningError codes to service error codes for backward compatibility
      if (error instanceof ProvisioningError) {
        if (error.code === 'EMAIL_EXISTS') {
          throw { code: 'EMAIL_DUPLICATE', statusCode: 409 }
        }
        if (error.code === 'KEYCLOAK_ERROR') {
          throw { code: 'KEYCLOAK_ERROR', statusCode: 500, details: error.details }
        }
        if (error.code === 'ROLLBACK_FAILED') {
          throw { code: 'ROLLBACK_FAILED', statusCode: 500, details: error.details }
        }
      }
      // Re-throw any other errors
      throw error
    }
  },

}

module.exports = GestionnaireService
