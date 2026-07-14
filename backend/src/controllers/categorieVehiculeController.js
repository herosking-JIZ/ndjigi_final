const { prisma } = require('../config/db');

const categorieVehiculeController = {

    // GET /config/categories
    async lister(req, res) {
        try {
            const { actif, nom, page = 1, limit = 20 } = req.query;
            const skip = (page - 1) * limit;
            const where = {};

            if (actif !== undefined) where.actif = actif === 'true';
            if (nom) where.nom = { contains: nom, mode: 'insensitive' };

            const [categories, total] = await Promise.all([
                prisma.categorie_vehicule.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { nom: 'asc' },
                }),
                prisma.categorie_vehicule.count({ where }),
            ]);

            return res.status(200).json({
                success: true,
                message: 'Catégories récupérées avec succès.',
                data: {
                    data: categories,
                    meta: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit),
                    },
                },
                errors: null,
            });

        } catch (error) {
            console.error('[Categorie.lister]', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la récupération des catégories.',
                data: null,
                errors: error.message,
            });
        }
    },

    // GET /config/categories/:id
    async findOne(req, res) {
        try {
            const categorie = await prisma.categorie_vehicule.findUnique({
                where: { id_categorie: req.params.id },
            });

            if (!categorie) {
                return res.status(404).json({
                    success: false,
                    message: 'Catégorie introuvable.',
                    data: null,
                    errors: { code: 'CATEGORIE_NOT_FOUND' },
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Catégorie trouvée.',
                data: categorie,
                errors: null,
            });

        } catch (error) {
            console.error('[Categorie.findOne]', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur.',
                data: null,
                errors: error.message,
            });
        }
    },

    // POST /config/categories
    async create(req, res) {
        try {
            const { nom, description, actif } = req.body;

            const categorie = await prisma.categorie_vehicule.create({
                data: { nom, description, actif },
            });

            return res.status(201).json({
                success: true,
                message: 'Catégorie créée avec succès.',
                data: categorie,
                errors: null,
            });

        } catch (error) {
            console.error('[Categorie.create]', error);

            if (error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    message: 'Une catégorie avec ce nom existe déjà.',
                    data: null,
                    errors: { field: 'nom', code: 'DUPLICATE_NOM' },
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la création.',
                data: null,
                errors: error.message,
            });
        }
    },

    // PUT /config/categories/:id
    async modifier(req, res) {
        try {
            const { nom, description, actif } = req.body;

            const data = {};
            if (nom !== undefined) data.nom = nom;
            if (description !== undefined) data.description = description;
            if (actif !== undefined) data.actif = actif;

            const categorie = await prisma.categorie_vehicule.update({
                where: { id_categorie: req.params.id },
                data,
            });

            return res.status(200).json({
                success: true,
                message: 'Catégorie mise à jour avec succès.',
                data: categorie,
                errors: null,
            });

        } catch (error) {
            console.error('[Categorie.modifier]', error);

            if (error.code === 'P2025') {
                return res.status(404).json({
                    success: false,
                    message: 'Catégorie introuvable.',
                    data: null,
                    errors: { code: 'CATEGORIE_NOT_FOUND' },
                });
            }

            if (error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    message: 'Une catégorie avec ce nom existe déjà.',
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

    // DELETE /config/categories/:id
    async supprimer(req, res) {
        try {
            // Bloquer si des véhicules actifs utilisent cette catégorie
            const vehiculesActifs = await prisma.vehicule.count({
                where: {
                    id_categorie: req.params.id,
                    supprime_le: null,
                },
            });

            if (vehiculesActifs > 0) {
                return res.status(409).json({
                    success: false,
                    message: `Suppression impossible : ${vehiculesActifs} véhicule(s) appartiennent à cette catégorie.`,
                    data: null,
                    errors: { code: 'DEPENDENCY_CONFLICT', count: vehiculesActifs },
                });
            }

            // Supprimer les tarifs liés avant la catégorie
            await prisma.tarif_categorie_zone.deleteMany({
                where: { id_categorie: req.params.id },
            });

            await prisma.categorie_vehicule.delete({
                where: { id_categorie: req.params.id },
            });

            return res.status(200).json({
                success: true,
                message: 'Catégorie supprimée avec succès.',
                data: null,
                errors: null,
            });

        } catch (error) {
            console.error('[Categorie.supprimer]', error);

            if (error.code === 'P2025') {
                return res.status(404).json({
                    success: false,
                    message: 'Catégorie introuvable.',
                    data: null,
                    errors: { code: 'CATEGORIE_NOT_FOUND' },
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la suppression.',
                data: null,
                errors: error.message,
            });
        }
    },
};

module.exports = categorieVehiculeController;