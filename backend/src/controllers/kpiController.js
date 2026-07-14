// const {prisma }= require('../config/db');

const dashboardController = {
    
    // GET /api/v1/dashboard/kpis
    async getKpis(req, res) {
        try {
            // ===== CODE ORIGINAL (COMMENTÉ) =====
            // const startOfDay = new Date();
            // startOfDay.setHours(0, 0, 0, 0);

            // const [totalUsers,coursesToday] = await Promise.all([
            //     prisma.utilisateur.count({ where: { supprime_le: null } }),
            //     prisma.trajet.count({
            //         where: {
            //             date_heure_debut: { gte: startOfDay }
            //         }
            //     }),
            // ]);

            // ===== DONNÉES SIMULÉES =====
            const simulatedData = {
                total_utilisateurs: 1245,
                courses_aujourd_hui: 387,
                revenus_commission_jour: 875000,
                satisfaction_moyenne: 4.7,
                tendance_utilisateurs: 15,
                tendance_courses: 22
            };

            return res.status(200).json({
                success: true,
                message: "Indicateurs clés de performance du jour",
                data: simulatedData,
                errors : null
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: err.message,
                data : null,
                errors : null
            });
        }
    },

    // GET /api/v1/dashboard/top-chauffeurs
  async getTopChauffeurs(req, res) {
    try {
        // ===== CODE ORIGINAL (COMMENTÉ) =====
        // // Requête SQL pour récupérer les 5 meilleurs chauffeurs selon note_chauffeur,
        // // avec leur chiffre d'affaires total (somme des tarifs des trajets terminés)
        // const result = await prisma.$queryRaw`
        //     SELECT
        //         u.nom,
        //         u.prenom,
        //         c.note_chauffeur AS note,
        //         COALESCE(SUM(t.tarif_final), 0) AS chiffre_affaires
        //     FROM "chauffeur" c
        //     INNER JOIN "utilisateur" u ON c.id_chauffeur = u.id_utilisateur
        //     LEFT JOIN "affectation_vehicule" av ON av.id_chauffeur = c.id_chauffeur
        //     LEFT JOIN "trajet" t ON t.id_affectation = av.id_affectation
        //         AND t.statut = 'termine'
        //         AND t.date_heure_fin IS NOT NULL
        //     WHERE u.supprime_le IS NULL
        //     GROUP BY c.id_chauffeur, u.nom, u.prenom, c.note_chauffeur
        //     ORDER BY c.note_chauffeur DESC NULLS LAST, chiffre_affaires DESC
        //     LIMIT 5
        // `;

        // // Formatage des données avec rang et nom complet
        // const topChauffeurs = result.map((row, index) => ({
        //     rang: index + 1,
        //     nom: `${row.prenom} ${row.nom}`,
        //     chiffre_affaires: Number(row.chiffre_affaires)
        // }));

        // ===== DONNÉES SIMULÉES =====
        const topChauffeurs = [
            {
                rang: 1,
                nom: "Ousmane Traoré",
                chiffre_affaires: 2450000
            },
            {
                rang: 2,
                nom: "Ibrahim Diallo",
                chiffre_affaires: 2180000
            },
            {
                rang: 3,
                nom: "Moussa Kone",
                chiffre_affaires: 1920000
            },
            {
                rang: 4,
                nom: "Karim Cissé",
                chiffre_affaires: 1750000
            },
            {
                rang: 5,
                nom: "Aliou Sow",
                chiffre_affaires: 1580000
            }
        ];

        return res.status(200).json({
            success: true,
            message: "Top 5 des chauffeurs par note moyenne",
            data: topChauffeurs,
            errors: null
        });
    } catch (err) {
        console.error("Erreur getTopChauffeurs:", err);
        return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération du classement des chauffeurs",
            errors: err.message,
            data: null
        });
    }
    },


 // GET /api/v1/dashboard/courses-semaine
    async getWeeklyStats(req, res) {
        try {
            // ===== CODE ORIGINAL (COMMENTÉ) =====
            // // 1. Définir la plage de la semaine en cours (du lundi 00:00:00 au dimanche 23:59:59)
            // const now = new Date();
            // const dayOfWeek = now.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
            // // Ajustement pour que lundi soit le premier jour (si lundi = 1, dimanche = 0 devient 7)
            // const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

            // const startOfWeek = new Date(now);
            // startOfWeek.setDate(now.getDate() - mondayOffset);
            // startOfWeek.setHours(0, 0, 0, 0);

            // const endOfWeek = new Date(startOfWeek);
            // endOfWeek.setDate(startOfWeek.getDate() + 6);
            // endOfWeek.setHours(23, 59, 59, 999);

            // // 2. Requête Prisma : group by jour de la semaine sur les trajets créés dans la semaine
            // const results = await prisma.$queryRaw`
            //     SELECT
            //         EXTRACT(ISODOW FROM "date_heure_debut")::int AS day_of_week,
            //         COUNT(*)::int AS count
            //     FROM "trajet"
            //     WHERE "date_heure_debut" >= ${startOfWeek}
            //     AND "date_heure_debut" <= ${endOfWeek}
            //     AND "statut" = 'termine'
            //     GROUP BY day_of_week
            //     ORDER BY day_of_week`;

            // // 3. Formatage des données pour correspondre aux attentes du front
            // const dayLabels = {
            //     1: 'Lundi',
            //     2: 'Mardi',
            //     3: 'Mercredi',
            //     4: 'Jeudi',
            //     5: 'Vendredi',
            //     6: 'Samedi',
            //     7: 'Dimanche'
            // };

            // const weeklyData = [1, 2, 3, 4, 5, 6, 7].map(day => {
            //     const found = results.find(r => Number(r.day_of_week) === day);
            //     return {
            //         label: dayLabels[day],
            //         value: found ? found.count : 0
            //     };
            // });

            // ===== DONNÉES SIMULÉES =====
            const weeklyData = [
                { label: 'Lundi', value: 52 },
                { label: 'Mardi', value: 68 },
                { label: 'Mercredi', value: 71 },
                { label: 'Jeudi', value: 84 },
                { label: 'Vendredi', value: 95 },
                { label: 'Samedi', value: 112 },
                { label: 'Dimanche', value: 88 }
            ];

            // 4. Réponse standardisée
            return res.status(200).json({
                success: true,
                message: `Statistiques de la semaine`,
                data: weeklyData,
                errors: null
            });

        } catch (err) {
            console.error('Erreur getWeeklyStats:', err);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques hebdomadaires',
                errors: err.message,
                data: null
            });
        }
},


    // GET /api/v1/dashboard/moyens-paiement
async getPaymentMethodsStats(req, res) {
    try {
        // ===== CODE ORIGINAL (COMMENTÉ) =====
        // const startOfDay = new Date();
        // startOfDay.setHours(0, 0, 0, 0);

        // const endOfDay = new Date();
        // endOfDay.setHours(23, 59, 59, 999);

        // // Dictionnaire pour regrouper les types similaires
        // const METHOD_LABELS = {
        //     'CARTE_BANCAIRE': 'Carte Bancaire',
        //     'MOBILE_MONEY': 'Mobile Money',
        //     'PORTEFEUILLE': 'Portefeuille',
        // };

        // // Requête optimisée : agrégation SQL avec jointure vers moyens_paiement (1 requête au lieu de N+1)
        // const stats = await prisma.$queryRaw`
        //     SELECT
        //         mp.type,
        //         COUNT(p.id_paiement)::int AS count
        //     FROM "paiement" p
        //     INNER JOIN "moyens_paiement" mp ON p.id_moyen_paiement = mp.id_moyen_paiement
        //     WHERE p.date_paiement >= ${startOfDay}
        //         AND p.date_paiement <= ${endOfDay}
        //         AND p.statut = 'complete'
        //     GROUP BY mp.type
        // `;

        // // Calculer le total des paiements
        // const total = stats.reduce((sum, item) => sum + item.count, 0);

        // // Cas limite : aucun paiement ce jour → retourner tableau vide
        // if (total === 0) {
        //     return res.status(200).json({
        //         success: true,
        //         data: [],
        //         message: "Aucun paiement complété aujourd'hui",
        //         errors: null
        //     });
        // }

        // // Regrouper par label et compter (avant calcul des %)
        // const groupedCounts = {};
        // stats.forEach(item => {
        //     const label = METHOD_LABELS[item.type] || 'Autre';
        //     groupedCounts[label] = (groupedCounts[label] || 0) + item.count;
        // });

        // // Calculer les pourcentages pour chaque groupe, filtrer les zéros, puis trier décroissant
        // const formattedData = Object.entries(groupedCounts)
        //     .map(([name, count]) => ({
        //         name,
        //         value: Math.round((count / total) * 100)
        //     }))
        //     .filter(item => item.value > 0)
        //     .sort((a, b) => b.value - a.value);

        // ===== DONNÉES SIMULÉES =====
        const formattedData = [
            { name: 'Mobile Money', value: 45 },
            { name: 'Carte Bancaire', value: 35 },
            { name: 'Portefeuille', value: 20 }
        ];

        return res.status(200).json({
            success: true,
            data: formattedData,
            message: "Répartition dynamique des paiements du jour",
            errors: null
        });

    } catch (err) {
        console.error('❌ Erreur getPaymentMethodsStats:', err);
        return res.status(500).json({
            success: false,
            message: err.message,
            data: null,
            errors: null
        });
        }
    },
    // GET /api/v1/dashboard/evolution-mensuelle
async getEvolutionMensuelle(req, res) {
  try {
    // ===== CODE ORIGINAL (COMMENTÉ) =====
    // // Construire les 7 derniers mois
    // const mois = [];
    // const now = new Date();
    // for (let i = 6; i >= 0; i--) {
    //   const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    //   mois.push({
    //     debut: new Date(d.getFullYear(), d.getMonth(), 1),
    //     fin: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
    //     label: d.toLocaleDateString('fr-FR', { month: 'short' }),
    //   });
    // }

    // // Une seule requête SQL avec 7 COUNT(*) FILTER en parallèle (vs 7 requêtes séparées)
    // // Cast en INT pour éviter les BigInt (qui ne sont pas sérialisables en JSON)
    // const result = await prisma.$queryRaw`
    //   SELECT
    //     COUNT(*) FILTER (WHERE date_heure_debut >= ${mois[0].debut} AND date_heure_debut <= ${mois[0].fin})::int AS count_0,
    //     COUNT(*) FILTER (WHERE date_heure_debut >= ${mois[1].debut} AND date_heure_debut <= ${mois[1].fin})::int AS count_1,
    //     COUNT(*) FILTER (WHERE date_heure_debut >= ${mois[2].debut} AND date_heure_debut <= ${mois[2].fin})::int AS count_2,
    //     COUNT(*) FILTER (WHERE date_heure_debut >= ${mois[3].debut} AND date_heure_debut <= ${mois[3].fin})::int AS count_3,
    //     COUNT(*) FILTER (WHERE date_heure_debut >= ${mois[4].debut} AND date_heure_debut <= ${mois[4].fin})::int AS count_4,
    //     COUNT(*) FILTER (WHERE date_heure_debut >= ${mois[5].debut} AND date_heure_debut <= ${mois[5].fin})::int AS count_5,
    //     COUNT(*) FILTER (WHERE date_heure_debut >= ${mois[6].debut} AND date_heure_debut <= ${mois[6].fin})::int AS count_6
    //   FROM "trajet"
    //   WHERE statut = 'termine'
    // `;

    // const dataq = mois.map(({ label }, i) => ({
    //   label: label.charAt(0).toUpperCase() + label.slice(1, 3),
    //   value: result[0][`count_${i}`],
    // }));

    // ===== DONNÉES SIMULÉES =====
    const dataq = [
      { label: 'Dec', value: 245 },
      { label: 'Jan', value: 328 },
      { label: 'Fev', value: 412 },
      { label: 'Mar', value: 385 },
      { label: 'Avr', value: 521 },
      { label: 'Mai', value: 598 },
      { label: 'Jun', value: 654 }
    ];

    return res.status(200).json({
      success: true,
      data: dataq,
      message: "evolution mensuelle",
      errors: null
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      errors: null,
      data: null
    });
  }
}
};

module.exports = dashboardController;