/**
 * PHOTO CONTROLLER — Gestion des photos (galeries, metadata)
 *
 * Supports:
 * - Photo uploads for vehicles, users, parking movements, maintenance
 * - Gallery organization (ordre, is_principale)
 * - Soft delete via deletedAt
 * - Metadata updates (legende, ordre)
 */

const fs = require('fs').promises;
const path = require('path');
const { prisma } = require('../config/db');
const photoService = require('../services/photoService');
const { getStorageProvider } = require('../storage');

const PhotoController = {
  // ── Upload photo(s) for owner (vehicule, utilisateur, journal_parking) ────
  async uploadPhoto(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { ownerType, ownerId } = req.body;
      const files = req.files || (req.file ? [req.file] : []);

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded.',
          errors: { code: 'NO_FILES_UPLOADED' },
        });
      }

      if (!ownerType) {
        return res.status(400).json({
          success: false,
          message: 'owner_type is required.',
          errors: { code: 'MISSING_OWNER_TYPE' },
        });
      }

      // Validate owner type
      const validOwnerTypes = ['vehicule', 'utilisateur', 'journal_parking'];
      if (!validOwnerTypes.includes(ownerType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid owner_type. Valid types: vehicule, utilisateur, journal_parking',
          errors: { code: 'INVALID_OWNER_TYPE' },
        });
      }

      // Validate owner exists (if ownerId provided)
      if (ownerId && ownerType !== 'utilisateur') {
        const entityMap = {
          vehicule: 'vehicule',
          journal_parking: 'journal_parking',
        };
        const model = entityMap[ownerType];
        if (model) {
          const entity = await prisma[model].findUnique({
            where: { [model === 'journal_parking' ? 'id_log' : 'id_vehicule']: ownerId },
          });
          if (!entity) {
            return res.status(404).json({
              success: false,
              message: `${ownerType} not found.`,
              errors: { code: 'OWNER_NOT_FOUND' },
            });
          }
        }
      }

      // Upload each file
      const results = [];
      const errors = [];

      for (const file of files) {
        try {
          const result = await photoService.uploadPhoto({
            file,
            userId,
            ownerType,
            ownerId: ownerType === 'utilisateur' ? userId : ownerId,
            isPrincipale: req.body.isPrincipale === 'true',
            ordre: parseInt(req.body.ordre, 10) || 0,
            legende: req.body.legende || null,
          });
          results.push(result);
        } catch (error) {
          errors.push({
            filename: file.originalname,
            error: error.message,
          });
        }
      }

      if (results.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'All uploads failed.',
          errors,
        });
      }

      return res.status(201).json({
        success: true,
        message: `${results.length} photo(s) uploaded successfully.`,
        data: {
          photos: results,
          errors: errors.length > 0 ? errors : null,
        },
      });
    } catch (error) {
      console.error('[photo.uploadPhoto]', error);
      return res.status(500).json({
        success: false,
        message: 'Server error.',
        errors: { code: 'INTERNAL_ERROR', details: error.message },
      });
    }
  },

  // ── Get gallery for owner ──────────────────────────────────
  async getGallery(req, res) {
    try {
      const { ownerType, ownerId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      if (!ownerType || !ownerId) {
        return res.status(400).json({
          success: false,
          message: 'ownerType and ownerId are required.',
        });
      }

      const gallery = await photoService.getGallery({
        ownerType,
        ownerId,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });

      return res.status(200).json({
        success: true,
        message: 'Gallery retrieved.',
        data: gallery,
      });
    } catch (error) {
      console.error('[photo.getGallery]', error);
      return res.status(500).json({
        success: false,
        message: 'Server error.',
        errors: { code: 'INTERNAL_ERROR' },
      });
    }
  },

  // ── Get single photo metadata ──────────────────────────────
  async getPhotoMetadata(req, res) {
    try {
      const { photoId } = req.params;

      const photo = await prisma.photo.findUnique({
        where: { id_photo: photoId },
      });

      if (!photo) {
        return res.status(404).json({
          success: false,
          message: 'Photo not found.',
          errors: { code: 'PHOTO_NOT_FOUND' },
        });
      }

      if (photo.deletedAt) {
        return res.status(404).json({
          success: false,
          message: 'Photo not found.',
          errors: { code: 'PHOTO_NOT_FOUND' },
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Photo metadata retrieved.',
        data: photo,
      });
    } catch (error) {
      console.error('[photo.getPhotoMetadata]', error);
      return res.status(500).json({
        success: false,
        message: 'Server error.',
        errors: { code: 'INTERNAL_ERROR' },
      });
    }
  },

  // ── Serve photo file (with access control) ─────────────────
  async servePhoto(req, res) {
    try {
      const { photoId } = req.params;
      const { inline } = req.query;

      const photo = await prisma.photo.findUnique({
        where: { id_photo: photoId },
      });

      if (!photo || photo.deletedAt) {
        return res.status(404).json({
          success: false,
          message: 'Photo not found.',
          errors: { code: 'PHOTO_NOT_FOUND' },
        });
      }

      // Get storage provider and stream file
      const storage = getStorageProvider();
      let readStream;
      try {
        readStream = await storage.getReadStream(photo.fileKey);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'File not found in storage.',
          errors: { code: 'FILE_NOT_FOUND' },
        });
      }

      // Determine Content-Disposition
      const shouldDisplayInline = inline === 'true';
      const dispositionValue = shouldDisplayInline
        ? `inline; filename="${encodeURIComponent(photo.filename || 'photo')}"`
        : `attachment; filename="${encodeURIComponent(photo.filename || 'photo')}"`;

      // Set response headers
      res.setHeader('Content-Type', photo.mimeType || 'application/octet-stream');
      res.setHeader('Content-Length', (photo.fileSize || 0n).toString());
      res.setHeader('Content-Disposition', dispositionValue);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'");
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

      // Handle stream errors
      readStream.on('error', (error) => {
        console.error('[photo.servePhoto] Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error reading file.',
            errors: { code: 'FILE_READ_ERROR' },
          });
        }
      });

      readStream.pipe(res);
    } catch (error) {
      console.error('[photo.servePhoto]', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Server error.',
          errors: { code: 'INTERNAL_ERROR' },
        });
      }
    }
  },

  // ── Update photo metadata (legende, ordre, is_principale) ───
  async updatePhotoMetadata(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { photoId } = req.params;
      const { legende, ordre, is_principale } = req.body;

      const photo = await photoService.updatePhotoMetadata(photoId, userId, {
        legende,
        ordre,
        is_principale,
      });

      return res.status(200).json({
        success: true,
        message: 'Photo metadata updated.',
        data: photo,
      });
    } catch (error) {
      console.error('[photo.updatePhotoMetadata]', error);
      if (error.message === 'Photo not found.') {
        return res.status(404).json({
          success: false,
          message: 'Photo not found.',
          errors: { code: 'PHOTO_NOT_FOUND' },
        });
      }
      if (error.message === 'Permission denied.') {
        return res.status(403).json({
          success: false,
          message: 'Access denied.',
          errors: { code: 'FORBIDDEN' },
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Server error.',
        errors: { code: 'INTERNAL_ERROR', details: error.message },
      });
    }
  },

  // ── Soft delete photo (set deletedAt) ──────────────────────
  async deletePhoto(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { photoId } = req.params;

      await photoService.deletePhotoSoft(photoId, userId);

      return res.status(200).json({
        success: true,
        message: 'Photo deleted.',
      });
    } catch (error) {
      console.error('[photo.deletePhoto]', error);
      if (error.message === 'Photo not found.') {
        return res.status(404).json({
          success: false,
          message: 'Photo not found.',
          errors: { code: 'PHOTO_NOT_FOUND' },
        });
      }
      if (error.message === 'Permission denied.') {
        return res.status(403).json({
          success: false,
          message: 'Access denied.',
          errors: { code: 'FORBIDDEN' },
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Server error.',
        errors: { code: 'INTERNAL_ERROR' },
      });
    }
  },

  // ── Permanently delete photo (hard delete + storage) ────────
  async deletePhotoPermanent(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { photoId } = req.params;

      await photoService.deletePhotoPermanent(photoId, userId);

      return res.status(200).json({
        success: true,
        message: 'Photo permanently deleted.',
      });
    } catch (error) {
      console.error('[photo.deletePhotoPermanent]', error);
      if (error.message === 'Photo not found.') {
        return res.status(404).json({
          success: false,
          message: 'Photo not found.',
          errors: { code: 'PHOTO_NOT_FOUND' },
        });
      }
      if (error.message === 'Permission denied.') {
        return res.status(403).json({
          success: false,
          message: 'Access denied.',
          errors: { code: 'FORBIDDEN' },
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Server error.',
        errors: { code: 'INTERNAL_ERROR' },
      });
    }
  },
};

module.exports = PhotoController;
