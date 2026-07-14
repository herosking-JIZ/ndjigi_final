/**
 * CONTROLLERS/CONTACTCONTROLLER.JS
 * Emergency contact management endpoints
 */

const contactService = require('../services/contactService');

const contactController = {
  /**
   * POST /contacts-confiance
   * Create a new emergency contact
   */
  async createContact(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { nom, prenom, country_code, phone, relation } = req.body;

      const newContact = await contactService.createContact(userId, {
        nom,
        prenom,
        country_code,
        phone,
        relation
      });

      return res.status(201).json({
        success: true,
        message: 'Emergency contact created successfully.',
        data: newContact,
        errors: null
      });
    } catch (error) {
      console.error('[contactController.createContact]', error);

      if (error.message.includes('Maximum')) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: { code: 'CONTACT_LIMIT_EXCEEDED' }
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Server error.',
        errors: { code: 'INTERNAL_ERROR', details: error.message }
      });
    }
  },

  /**
   * GET /contacts-confiance
   * List user emergency contacts (with optional filters)
   */
  async listContacts(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { relation, search, page, limit } = req.query;

      const filters = {
        relation: relation || null,
        search: search || null,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20
      };

      const result = await contactService.listContacts(userId, filters);

      return res.status(200).json({
        success: true,
        message: 'Emergency contacts retrieved.',
        data: result,
        errors: null
      });
    } catch (error) {
      console.error('[contactController.listContacts]', error);
      return res.status(500).json({
        success: false,
        message: 'Server error.',
        errors: { code: 'INTERNAL_ERROR' }
      });
    }
  },

  /**
   * GET /contacts-confiance/:id
   * Get single emergency contact
   */
  async getContact(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { id } = req.params;

      const contact = await contactService.getContactById(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Emergency contact retrieved.',
        data: contact,
        errors: null
      });
    } catch (error) {
      console.error('[contactController.getContact]', error);

      if (error.message === 'Contact not found.') {
        return res.status(404).json({
          success: false,
          message: 'Emergency contact not found.',
          errors: { code: 'CONTACT_NOT_FOUND' }
        });
      }

      if (error.message === 'Permission denied.') {
        return res.status(403).json({
          success: false,
          message: 'Access denied.',
          errors: { code: 'FORBIDDEN' }
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Server error.',
        errors: { code: 'INTERNAL_ERROR' }
      });
    }
  },

  /**
   * PATCH /contacts-confiance/:id
   * Update emergency contact metadata
   */
  async updateContact(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { id } = req.params;
      const { nom, prenom, country_code, phone, relation } = req.body;

      const updated = await contactService.updateContact(id, userId, {
        nom,
        prenom,
        country_code,
        phone,
        relation
      });

      return res.status(200).json({
        success: true,
        message: 'Emergency contact updated successfully.',
        data: updated,
        errors: null
      });
    } catch (error) {
      console.error('[contactController.updateContact]', error);

      if (error.message === 'Contact not found.') {
        return res.status(404).json({
          success: false,
          message: 'Emergency contact not found.',
          errors: { code: 'CONTACT_NOT_FOUND' }
        });
      }

      if (error.message === 'Permission denied.') {
        return res.status(403).json({
          success: false,
          message: 'Access denied.',
          errors: { code: 'FORBIDDEN' }
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Server error.',
        errors: { code: 'INTERNAL_ERROR' }
      });
    }
  },

  /**
   * DELETE /contacts-confiance/:id
   * Soft delete emergency contact
   */
  async deleteContact(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { id } = req.params;

      await contactService.deleteContact(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Emergency contact deleted successfully.',
        data: null,
        errors: null
      });
    } catch (error) {
      console.error('[contactController.deleteContact]', error);

      if (error.message === 'Contact not found.') {
        return res.status(404).json({
          success: false,
          message: 'Emergency contact not found.',
          errors: { code: 'CONTACT_NOT_FOUND' }
        });
      }

      if (error.message === 'Permission denied.') {
        return res.status(403).json({
          success: false,
          message: 'Access denied.',
          errors: { code: 'FORBIDDEN' }
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Server error.',
        errors: { code: 'INTERNAL_ERROR' }
      });
    }
  },

  /**
   * GET /contacts-confiance/by-relation/:relation
   * Get contacts by relation type
   */
  async getByRelation(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { relation } = req.params;
      const { limit = 10 } = req.query;

      const contacts = await contactService.getContactsByRelation(
        userId,
        relation,
        parseInt(limit, 10)
      );

      return res.status(200).json({
        success: true,
        message: `Emergency contacts with relation '${relation}' retrieved.`,
        data: {
          relation,
          contacts,
          count: contacts.length
        },
        errors: null
      });
    } catch (error) {
      console.error('[contactController.getByRelation]', error);
      return res.status(500).json({
        success: false,
        message: 'Server error.',
        errors: { code: 'INTERNAL_ERROR' }
      });
    }
  },

  /**
   * GET /contacts-confiance/stats
   * Get contact statistics
   */
  async getStats(req, res) {
    try {
      const userId = req.user.id_utilisateur;

      const [totalCount, countByRelation] = await Promise.all([
        contactService.getTotalCount(userId),
        contactService.countByRelation(userId)
      ]);

      return res.status(200).json({
        success: true,
        message: 'Emergency contact statistics retrieved.',
        data: {
          total: totalCount,
          maxPerUser: contactService.MAX_CONTACTS_PER_USER,
          remaining: contactService.MAX_CONTACTS_PER_USER - totalCount,
          byRelation: countByRelation
        },
        errors: null
      });
    } catch (error) {
      console.error('[contactController.getStats]', error);
      return res.status(500).json({
        success: false,
        message: 'Server error.',
        errors: { code: 'INTERNAL_ERROR' }
      });
    }
  }
};

module.exports = contactController;
