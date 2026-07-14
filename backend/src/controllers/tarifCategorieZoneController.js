const { prisma } = require('../config/db');

const tarifCategorieZoneController = {

    // GET /config/tarifs/:id_zone
    // Retourne tous les tarifs d'une zone pour toutes ses catégories
    async listerParZone(req, res) {
        try {
            const { id_zone } = req.params;

            // Vérifier que la zone existe
            const zone = await prisma.zone_tarifaire.findUnique({
                where: { id_zone },
            });

            if (!zone) {
                return res.status(404).json({
                    success: false,
                    message: 'Zone tarifaire introuvable.',
                    data: null,
                    errors: { code: 'ZONE_NOT_FOUND' },
                });
            }

            const tarifs = await prisma.tarif_categorie_zone.findMany({
                where: { id_zone },
                include: {
                    categorie_vehicule: {
                        select: { id_categorie: true, nom: true, description: true, actif: true },
                    },
                },
                orderBy: {
                    categorie_vehicule: { nom: 'asc' },
                },
            });

            return res.status(200).json({
                success: true,
                message: 'Tarifs récupérés avec succès.',
                data: tarifs,
                errors: null,
            });

        } catch (error) {
            console.error('[Tarif.listerParZone]', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la récupération des tarifs.',
                data: null,
                errors: error.message,
            });
        }
    },

    // PUT /config/tarifs
    // Upsert : crée ou met à jour le tarif pour une combinaison zone × catégorie
    async upsert(req, res) {
        try {
            const { id_zone, id_categorie, tarif_base, tarif_km, tarif_minute, actif } = req.body;

            // Vérifier que la zone existe
            const zone = await prisma.zone_tarifaire.findUnique({
                where: { id_zone },
            });
            if (!zone) {
                return res.status(404).json({
                    success: false,
                    message: 'Zone tarifaire introuvable.',
                    data: null,
                    errors: { code: 'ZONE_NOT_FOUND' },
                });
            }

            // Vérifier que la catégorie existe
            const categorie = await prisma.categorie_vehicule.findUnique({
                where: { id_categorie },
            });
            if (!categorie) {
                return res.status(404).json({
                    success: false,
                    message: 'Catégorie de véhicule introuvable.',
                    data: null,
                    errors: { code: 'CATEGORIE_NOT_FOUND' },
                });
            }

            // upsert Prisma sur clé composite
            const tarif = await prisma.tarif_categorie_zone.upsert({
                where: {
                    id_zone_id_categorie: { id_zone, id_categorie },
                },
                update: { tarif_base, tarif_km, tarif_minute, actif },
                create: { id_zone, id_categorie, tarif_base, tarif_km, tarif_minute, actif },
                include: {
                    categorie_vehicule: {
                        select: { id_categorie: true, nom: true, description: true },
                    },
                    zone_tarifaire: {
                        select: { id_zone: true, nom: true, vitesse_moyenne_kmh: true },
                    },
                },
            });

            return res.status(200).json({
                success: true,
                message: 'Tarif enregistré avec succès.',
                data: tarif,
                errors: null,
            });

        } catch (error) {
            console.error('[Tarif.upsert]', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de l\'enregistrement du tarif.',
                data: null,
                errors: error.message,
            });
        }
    },
};

module.exports = tarifCategorieZoneController;