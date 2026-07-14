const { prisma } = require('../config/db');

const zoneTarifaireController = {

    // ─────────────────────────────────────────────────────────
    // GET /config/zones
    // ?corbeille=true → zones dans la corbeille
    // Par défaut    → zones actives non supprimées
    // ─────────────────────────────────────────────────────────
    async lister(req, res) {
        try {
            const { actif, nom, corbeille, page = 1, limit = 20 } = req.query;
            const skip = (page - 1) * limit;
            const where = {};

            if (corbeille === 'true') {
                where.supprime_le = { not: null };
            } else {
                where.supprime_le = null;
                if (actif !== undefined) where.actif = actif === 'true';
                if (nom) where.nom = { contains: nom, mode: 'insensitive' };
            }

            const [zones, total] = await Promise.all([
                prisma.zone_tarifaire.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { nom: 'asc' },
                }),
                prisma.zone_tarifaire.count({ where }),
            ]);

            return res.status(200).json({
                success: true,
                message: corbeille === 'true'
                    ? 'Corbeille récupérée avec succès.'
                    : 'Zones tarifaires récupérées avec succès.',
                data: {
                    data: zones,
                    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
                },
                errors: null,
            });

        } catch (error) {
            console.error('[Zone.lister]', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la récupération des zones.',
                data: null,
                errors: error.message,
            });
        }
    },

    // ─────────────────────────────────────────────────────────
    // GET /config/zones/:id
    // ─────────────────────────────────────────────────────────
    async findOne(req, res) {
        try {
            const zone = await prisma.zone_tarifaire.findUnique({
                where: { id_zone: req.params.id },
            });

            if (!zone || zone.supprime_le !== null) {
                return res.status(404).json({
                    success: false,
                    message: 'Zone tarifaire introuvable.',
                    data: null,
                    errors: { code: 'ZONE_NOT_FOUND' },
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Zone tarifaire trouvée.',
                data: zone,
                errors: null,
            });

        } catch (error) {
            console.error('[Zone.findOne]', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur.',
                data: null,
                errors: error.message,
            });
        }
    },

    // ─────────────────────────────────────────────────────────
    // POST /config/zones
    // ─────────────────────────────────────────────────────────
    async create(req, res) {
        try {
            const { nom, vitesse_moyenne_kmh, coefficient_max, actif } = req.body;

            const existante = await prisma.zone_tarifaire.findFirst({
                where: { nom, supprime_le: null },
            });

            if (existante) {
                return res.status(409).json({
                    success: false,
                    message: 'Une zone tarifaire avec ce nom existe déjà.',
                    data: null,
                    errors: { field: 'nom', code: 'DUPLICATE_NOM' },
                });
            }

            const zone = await prisma.zone_tarifaire.create({
                data: { nom, vitesse_moyenne_kmh, coefficient_max, actif },
            });

            return res.status(201).json({
                success: true,
                message: 'Zone tarifaire créée avec succès.',
                data: zone,
                errors: null,
            });

        } catch (error) {
            console.error('[Zone.create]', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la création.',
                data: null,
                errors: error.message,
            });
        }
    },

    // ─────────────────────────────────────────────────────────
    // PUT /config/zones/:id
    // ─────────────────────────────────────────────────────────
    async modifier(req, res) {
        try {
            const zone = await prisma.zone_tarifaire.findUnique({
                where: { id_zone: req.params.id },
            });

            if (!zone) {
                return res.status(404).json({
                    success: false,
                    message: 'Zone tarifaire introuvable.',
                    data: null,
                    errors: { code: 'ZONE_NOT_FOUND' },
                });
            }

            if (zone.supprime_le !== null) {
                return res.status(409).json({
                    success: false,
                    message: 'Impossible de modifier une zone dans la corbeille. Restaurez-la d\'abord.',
                    data: null,
                    errors: { code: 'ZONE_IN_TRASH' },
                });
            }

            const { nom, vitesse_moyenne_kmh, coefficient_max, actif } = req.body;
            const data = {};
            if (nom !== undefined) data.nom = nom;
            if (vitesse_moyenne_kmh !== undefined) data.vitesse_moyenne_kmh = vitesse_moyenne_kmh;
            if (coefficient_max !== undefined) data.coefficient_max = coefficient_max;
            if (actif !== undefined) data.actif = actif;

            const zoneModifiee = await prisma.zone_tarifaire.update({
                where: { id_zone: req.params.id },
                data,
            });

            return res.status(200).json({
                success: true,
                message: 'Zone tarifaire mise à jour avec succès.',
                data: zoneModifiee,
                errors: null,
            });

        } catch (error) {
            console.error('[Zone.modifier]', error);

            if (error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    message: 'Une zone tarifaire avec ce nom existe déjà.',
                    data: null,
                    errors: { field: 'nom', code: 'DUPLICATE_NOM' },
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la modification.',
                data: null,
                errors: error.message,
            });
        }
    },

    // ─────────────────────────────────────────────────────────
    // DELETE /config/zones/:id
    // Soft delete si des trajets existent, hard delete sinon
    // ─────────────────────────────────────────────────────────
    async supprimer(req, res) {
        try {
            const zone = await prisma.zone_tarifaire.findUnique({
                where: { id_zone: req.params.id },
            });

            if (!zone) {
                return res.status(404).json({
                    success: false,
                    message: 'Zone tarifaire introuvable.',
                    data: null,
                    errors: { code: 'ZONE_NOT_FOUND' },
                });
            }

            if (zone.supprime_le !== null) {
                return res.status(409).json({
                    success: false,
                    message: 'Cette zone est déjà dans la corbeille.',
                    data: null,
                    errors: { code: 'ALREADY_DELETED' },
                });
            }

            const nbTrajets = await prisma.trajet.count({
                where: { id_zone: req.params.id },
            });

            if (nbTrajets > 0) {
                const zoneCorbeille = await prisma.zone_tarifaire.update({
                    where: { id_zone: req.params.id },
                    data: { supprime_le: new Date() },
                });

                return res.status(200).json({
                    success: true,
                    message: `Cette zone est liée à ${nbTrajets} trajet(s) historique(s). Elle a été déplacée dans la corbeille. Vous pouvez la restaurer ou la supprimer définitivement.`,
                    data: zoneCorbeille,
                    errors: null,
                });
            }

            // Aucun trajet — suppression directe propre
            await prisma.tarif_categorie_zone.deleteMany({
                where: { id_zone: req.params.id },
            });

            await prisma.zone_tarifaire.delete({
                where: { id_zone: req.params.id },
            });

            return res.status(200).json({
                success: true,
                message: 'Zone tarifaire supprimée définitivement.',
                data: null,
                errors: null,
            });

        } catch (error) {
            console.error('[Zone.supprimer]', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la suppression.',
                data: null,
                errors: error.message,
            });
        }
    },

    // ─────────────────────────────────────────────────────────
    // PUT /config/zones/:id/restaurer
    // ─────────────────────────────────────────────────────────
    async restaurer(req, res) {
        try {
            const zone = await prisma.zone_tarifaire.findUnique({
                where: { id_zone: req.params.id },
            });

            if (!zone) {
                return res.status(404).json({
                    success: false,
                    message: 'Zone tarifaire introuvable.',
                    data: null,
                    errors: { code: 'ZONE_NOT_FOUND' },
                });
            }

            if (zone.supprime_le === null) {
                return res.status(409).json({
                    success: false,
                    message: 'Cette zone n\'est pas dans la corbeille.',
                    data: null,
                    errors: { code: 'NOT_IN_TRASH' },
                });
            }

            const conflit = await prisma.zone_tarifaire.findFirst({
                where: {
                    nom: zone.nom,
                    supprime_le: null,
                    id_zone: { not: req.params.id },
                },
            });

            if (conflit) {
                return res.status(409).json({
                    success: false,
                    message: `Impossible de restaurer : une zone active nommée "${zone.nom}" existe déjà. Renommez l'une des deux avant de restaurer.`,
                    data: null,
                    errors: { code: 'DUPLICATE_NOM_ON_RESTORE', nom: zone.nom },
                });
            }

            const zoneRestauree = await prisma.zone_tarifaire.update({
                where: { id_zone: req.params.id },
                data: { supprime_le: null },
            });

            return res.status(200).json({
                success: true,
                message: 'Zone tarifaire restaurée avec succès.',
                data: zoneRestauree,
                errors: null,
            });

        } catch (error) {
            console.error('[Zone.restaurer]', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la restauration.',
                data: null,
                errors: error.message,
            });
        }
    },

    // ─────────────────────────────────────────────────────────
    // DELETE /config/zones/:id/forcer
    // Hard delete définitif — transaction atomique
    // ⚠️ Irréversible : supprime les trajets et données financières liés
    // ─────────────────────────────────────────────────────────
    async supprimerDefinitivement(req, res) {
        try {
            const zone = await prisma.zone_tarifaire.findUnique({
                where: { id_zone: req.params.id },
            });

            if (!zone) {
                return res.status(404).json({
                    success: false,
                    message: 'Zone tarifaire introuvable.',
                    data: null,
                    errors: { code: 'ZONE_NOT_FOUND' },
                });
            }

            const [nbTrajets, nbTarifs] = await Promise.all([
                prisma.trajet.count({ where: { id_zone: req.params.id } }),
                prisma.tarif_categorie_zone.count({ where: { id_zone: req.params.id } }),
            ]);

            await prisma.$transaction(async (tx) => {
                await tx.tarif_categorie_zone.deleteMany({ where: { id_zone: req.params.id } });
                await tx.trajet.deleteMany({ where: { id_zone: req.params.id } });
                await tx.zone_tarifaire.delete({ where: { id_zone: req.params.id } });
            });

            return res.status(200).json({
                success: true,
                message: `Zone "${zone.nom}" supprimée définitivement avec ${nbTrajets} trajet(s) et ${nbTarifs} tarif(s) associés.`,
                data: null,
                errors: null,
            });

        } catch (error) {
            console.error('[Zone.supprimerDefinitivement]', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la suppression définitive.',
                data: null,
                errors: error.message,
            });
        }
    },
};

module.exports = zoneTarifaireController;