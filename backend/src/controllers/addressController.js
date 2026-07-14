/**
 * CONTROLLERS/ADDRESSCONTROLLER.JS
 * Address management endpoints
 */

const addressService = require('../services/addressService');

const addressController = {
  /**
   * POST /addresses
   * Create a new address
   */
  async createAddress(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { label, address, latitude, longitude, isfavorite } = req.body;

      // Validate geolocation
      if (!addressService.isValidGeolocation(latitude, longitude)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid geolocation coordinates.',
          errors: {
            code: 'INVALID_GEOLOCATION',
            details: 'Latitude must be -90 to 90, longitude must be -180 to 180'
          }
        });
      }

      const newAddress = await addressService.createAddress(userId, {
        label,
        address,
        latitude,
        longitude,
        isfavorite: isfavorite || false
      });

      return res.status(201).json({
        success: true,
        message: 'Address created successfully.',
        data: newAddress,
        errors: null
      });
    } catch (error) {
      console.error('[addressController.createAddress]', error);
      return res.status(500).json({
        success: false,
        message: 'Server error.',
        errors: { code: 'INTERNAL_ERROR', details: error.message }
      });
    }
  },

  /**
   * GET /addresses
   * List user addresses (with optional filters)
   */
  async listAddresses(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { favorite, label, search, page, limit } = req.query;

      const filters = {
        favorite: favorite !== undefined ? favorite === 'true' : null,
        label: label || null,
        search: search || null,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20
      };

      const result = await addressService.listAddresses(userId, filters);

      return res.status(200).json({
        success: true,
        message: 'Addresses retrieved.',
        data: result,
        errors: null
      });
    } catch (error) {
      console.error('[addressController.listAddresses]', error);
      return res.status(500).json({
        success: false,
        message: 'Server error.',
        errors: { code: 'INTERNAL_ERROR' }
      });
    }
  },

  /**
   * GET /addresses/:id
   * Get single address
   */
  async getAddress(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { id } = req.params;

      const address = await addressService.getAddressById(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Address retrieved.',
        data: address,
        errors: null
      });
    } catch (error) {
      console.error('[addressController.getAddress]', error);

      if (error.message === 'Address not found.') {
        return res.status(404).json({
          success: false,
          message: 'Address not found.',
          errors: { code: 'ADDRESS_NOT_FOUND' }
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
   * PATCH /addresses/:id
   * Update address metadata
   */
  async updateAddress(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { id } = req.params;
      const { label, address, latitude, longitude, isfavorite } = req.body;

      // Validate geolocation if provided
      if ((latitude !== undefined || longitude !== undefined) && !addressService.isValidGeolocation(latitude, longitude)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid geolocation coordinates.',
          errors: {
            code: 'INVALID_GEOLOCATION'
          }
        });
      }

      const updated = await addressService.updateAddress(id, userId, {
        label,
        address,
        latitude,
        longitude,
        isfavorite
      });

      return res.status(200).json({
        success: true,
        message: 'Address updated successfully.',
        data: updated,
        errors: null
      });
    } catch (error) {
      console.error('[addressController.updateAddress]', error);

      if (error.message === 'Address not found.') {
        return res.status(404).json({
          success: false,
          message: 'Address not found.',
          errors: { code: 'ADDRESS_NOT_FOUND' }
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
   * DELETE /addresses/:id
   * Delete address
   */
  async deleteAddress(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { id } = req.params;

      await addressService.deleteAddress(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Address deleted successfully.',
        data: null,
        errors: null
      });
    } catch (error) {
      console.error('[addressController.deleteAddress]', error);

      if (error.message === 'Address not found.') {
        return res.status(404).json({
          success: false,
          message: 'Address not found.',
          errors: { code: 'ADDRESS_NOT_FOUND' }
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
   * PATCH /addresses/:id/favorite
   * Toggle favorite status
   */
  async toggleFavorite(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { id } = req.params;

      const updated = await addressService.toggleFavorite(id, userId);

      return res.status(200).json({
        success: true,
        message: `Address ${updated.isfavorite ? 'marked' : 'unmarked'} as favorite.`,
        data: updated,
        errors: null
      });
    } catch (error) {
      console.error('[addressController.toggleFavorite]', error);

      if (error.message === 'Address not found.') {
        return res.status(404).json({
          success: false,
          message: 'Address not found.',
          errors: { code: 'ADDRESS_NOT_FOUND' }
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
   * GET /addresses/favorites
   * Get user favorite addresses
   */
  async getFavorites(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { limit = 10 } = req.query;

      const favorites = await addressService.getFavorites(userId, parseInt(limit, 10));

      return res.status(200).json({
        success: true,
        message: 'Favorite addresses retrieved.',
        data: {
          addresses: favorites,
          count: favorites.length
        },
        errors: null
      });
    } catch (error) {
      console.error('[addressController.getFavorites]', error);
      return res.status(500).json({
        success: false,
        message: 'Server error.',
        errors: { code: 'INTERNAL_ERROR' }
      });
    }
  }
};

module.exports = addressController;
