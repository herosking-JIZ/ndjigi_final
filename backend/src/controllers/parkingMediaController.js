const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { fileTypeFromFile } = require('file-type');
const { prisma } = require('../config/db');
const { getStorageProvider } = require('../storage');

const TYPES_AUTORISES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']);

async function enregistrerPhoto(req, res, owner) {
  const file = req.file;
  if (!file) return res.status(400).json({ success: false, message: 'Une photo est requise.' });

  try {
    const detected = await fileTypeFromFile(file.path);
    if (!detected || !TYPES_AUTORISES.has(detected.mime)) {
      return res.status(400).json({ success: false, message: 'Format d’image invalide.' });
    }

    const entity = owner === 'mouvement'
      ? await prisma.journal_parking.findFirst({
          where: { id_log: req.params.mouvementId, id_parking: req.params.parkingId }
        })
      : await prisma.maintenance.findFirst({
          where: { id_maintenance: req.params.maintenanceId, id_parking: req.params.parkingId }
        });
    if (!entity) return res.status(404).json({ success: false, message: 'Élément introuvable dans ce parking.' });

    const extension = detected.ext === 'jpeg' ? 'jpg' : detected.ext;
    const fileKey = `parking/${owner}/${req.params[owner === 'mouvement' ? 'mouvementId' : 'maintenanceId']}/${crypto.randomUUID()}.${extension}`;
    const photo = await prisma.mouvement_photo.create({
      data: {
        ...(owner === 'mouvement' ? { id_mouvement: entity.id_log } : { id_maintenance: entity.id_maintenance }),
        filename: path.basename(file.originalname),
        fileKey,
        mimeType: detected.mime,
        fileSize: BigInt(file.size)
      }
    });

    try {
      await getStorageProvider().save(file.path, fileKey);
    } catch (error) {
      await prisma.mouvement_photo.delete({ where: { id_photo: photo.id_photo } });
      throw error;
    }

    return res.status(201).json({
      success: true,
      data: { id_photo: photo.id_photo, url: `/api/v1/parkings/${req.params.parkingId}/photos/${photo.id_photo}` }
    });
  } catch (error) {
    console.error('[parkingMedia.upload]', error);
    return res.status(500).json({ success: false, message: "Échec de l’enregistrement de la photo." });
  } finally {
    if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
  }
}

const ParkingMediaController = {
  uploadMouvement(req, res) { return enregistrerPhoto(req, res, 'mouvement'); },
  uploadMaintenance(req, res) { return enregistrerPhoto(req, res, 'maintenance'); },

  async serve(req, res) {
    try {
      const photo = await prisma.mouvement_photo.findFirst({
        where: {
          id_photo: req.params.photoId,
          OR: [
            { journal_parking: { id_parking: req.params.parkingId } },
            { maintenance: { id_parking: req.params.parkingId } }
          ]
        }
      });
      if (!photo) return res.status(404).json({ success: false, message: 'Photo introuvable.' });

      const stream = await getStorageProvider().getReadStream(photo.fileKey);
      res.setHeader('Content-Type', photo.mimeType);
      res.setHeader('Content-Length', photo.fileSize.toString());
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(photo.filename)}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      stream.on('error', (error) => {
        console.error('[parkingMedia.serve]', error);
        if (!res.headersSent) res.status(500).end();
      });
      return stream.pipe(res);
    } catch (error) {
      console.error('[parkingMedia.serve]', error);
      return res.status(404).json({ success: false, message: 'Fichier introuvable.' });
    }
  },

  async remove(req, res) {
    try {
      const photo = await prisma.mouvement_photo.findFirst({
        where: {
          id_photo: req.params.photoId,
          OR: [
            { journal_parking: { id_parking: req.params.parkingId } },
            { maintenance: { id_parking: req.params.parkingId } }
          ]
        }
      });
      if (!photo) return res.status(404).json({ success: false, message: 'Photo introuvable.' });
      await prisma.mouvement_photo.delete({ where: { id_photo: photo.id_photo } });
      await getStorageProvider().delete(photo.fileKey);
      return res.status(200).json({ success: true, message: 'Photo supprimée.' });
    } catch (error) {
      console.error('[parkingMedia.remove]', error);
      return res.status(500).json({ success: false, message: 'Suppression impossible.' });
    }
  }
};

module.exports = ParkingMediaController;
