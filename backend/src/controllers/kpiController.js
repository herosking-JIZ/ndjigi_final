const { prisma } = require('../config/db')

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const LABELS_PAIEMENT = {
  CARTE_BANCAIRE: 'Carte bancaire',
  MOBILE_MONEY: 'Mobile Money',
  PORTEFEUILLE: 'Portefeuille',
}

function debutJour(date = new Date()) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function ajouterJours(date, jours) {
  const value = new Date(date)
  value.setDate(value.getDate() + jours)
  return value
}

function tendance(courant, precedent) {
  if (!precedent) return courant ? 100 : 0
  return Math.round(((courant - precedent) / precedent) * 100)
}

function erreur(res, message, err) {
  console.error(`[dashboard] ${message}`, err)
  return res.status(500).json({ success: false, message, data: null, errors: err.message })
}

const dashboardController = {
  async getKpis(req, res) {
    try {
      const aujourdHui = debutJour()
      const demain = ajouterJours(aujourdHui, 1)
      const hier = ajouterJours(aujourdHui, -1)
      const ilYa30Jours = ajouterJours(aujourdHui, -30)
      const ilYa60Jours = ajouterJours(aujourdHui, -60)
      const filtreTermine = { statut: 'termine' }

      const [totalUsers, coursesJour, coursesHier, users30, users30Precedent, satisfaction] = await Promise.all([
        prisma.utilisateur.count({ where: { supprime_le: null } }),
        prisma.trajet.aggregate({
          where: { ...filtreTermine, date_heure_fin: { gte: aujourdHui, lt: demain } },
          _count: { _all: true }, _sum: { tarif_final: true },
        }),
        prisma.trajet.count({ where: { ...filtreTermine, date_heure_fin: { gte: hier, lt: aujourdHui } } }),
        prisma.utilisateur.count({ where: { supprime_le: null, date_inscription: { gte: ilYa30Jours, lt: demain } } }),
        prisma.utilisateur.count({ where: { supprime_le: null, date_inscription: { gte: ilYa60Jours, lt: ilYa30Jours } } }),
        prisma.avis.aggregate({ where: { note: { not: null } }, _avg: { note: true } }),
      ])

      const tauxCommission = Number(process.env.TAUX_COMMISSION || 15) / 100
      const nombreCourses = coursesJour._count._all
      return res.status(200).json({
        success: true,
        message: 'Indicateurs clés de performance du jour',
        data: {
          total_utilisateurs: totalUsers,
          courses_aujourd_hui: nombreCourses,
          revenus_commission_jour: Math.round(Number(coursesJour._sum.tarif_final || 0) * tauxCommission),
          satisfaction_moyenne: Number(Number(satisfaction._avg.note || 0).toFixed(1)),
          tendance_utilisateurs: tendance(users30, users30Precedent),
          tendance_courses: tendance(nombreCourses, coursesHier),
        },
        errors: null,
      })
    } catch (err) {
      return erreur(res, 'Erreur lors de la récupération des indicateurs', err)
    }
  },

  async getTopChauffeurs(req, res) {
    try {
      const rows = await prisma.$queryRaw`
        SELECT u.nom, u.prenom, c.note_chauffeur AS note,
               COALESCE(SUM(t.tarif_final), 0) AS chiffre_affaires
        FROM "chauffeur" c
        JOIN "utilisateur" u ON u.id_utilisateur = c.id_chauffeur
        LEFT JOIN "affectation_vehicule" av ON av.id_chauffeur = c.id_chauffeur
        LEFT JOIN "trajet" t ON t.id_affectation = av.id_affectation AND t.statut = 'termine'
        WHERE u.supprime_le IS NULL
        GROUP BY c.id_chauffeur, u.nom, u.prenom, c.note_chauffeur
        ORDER BY chiffre_affaires DESC, c.note_chauffeur DESC NULLS LAST
        LIMIT 5
      `
      const data = rows.map((row, index) => ({
        rang: index + 1,
        nom: `${row.prenom} ${row.nom}`,
        note: row.note == null ? null : Number(row.note),
        chiffre_affaires: Number(row.chiffre_affaires),
      }))
      return res.status(200).json({ success: true, message: "Top 5 des chauffeurs par chiffre d'affaires", data, errors: null })
    } catch (err) {
      return erreur(res, 'Erreur lors de la récupération du classement des chauffeurs', err)
    }
  },

  async getWeeklyStats(req, res) {
    try {
      const maintenant = new Date()
      const lundi = debutJour(maintenant)
      lundi.setDate(lundi.getDate() - (lundi.getDay() === 0 ? 6 : lundi.getDay() - 1))
      const fin = ajouterJours(lundi, 7)
      const trajets = await prisma.trajet.findMany({
        where: { statut: 'termine', date_heure_fin: { gte: lundi, lt: fin } },
        select: { date_heure_fin: true },
      })
      const comptes = Array(7).fill(0)
      trajets.forEach(({ date_heure_fin }) => {
        if (date_heure_fin) comptes[(date_heure_fin.getDay() + 6) % 7] += 1
      })
      const data = JOURS.map((label, index) => ({ label, value: comptes[index] }))
      return res.status(200).json({ success: true, message: 'Statistiques de la semaine', data, errors: null })
    } catch (err) {
      return erreur(res, 'Erreur lors de la récupération des statistiques hebdomadaires', err)
    }
  },

  async getPaymentMethodsStats(req, res) {
    try {
      const debut = debutJour()
      const fin = ajouterJours(debut, 1)
      const groupes = await prisma.paiement.groupBy({
        by: ['id_moyen_paiement', 'methode'],
        where: { statut: 'complete', date_paiement: { gte: debut, lt: fin } },
        _count: { _all: true },
      })
      const ids = groupes.map((g) => g.id_moyen_paiement).filter(Boolean)
      const moyens = ids.length ? await prisma.moyens_paiement.findMany({
        where: { id_moyen_paiement: { in: ids } }, select: { id_moyen_paiement: true, type: true },
      }) : []
      const types = new Map(moyens.map((m) => [m.id_moyen_paiement, m.type]))
      const comptes = {}
      groupes.forEach((g) => {
        const type = types.get(g.id_moyen_paiement) || g.methode?.toUpperCase() || 'AUTRE'
        const label = LABELS_PAIEMENT[type] || 'Autre'
        comptes[label] = (comptes[label] || 0) + g._count._all
      })
      const total = Object.values(comptes).reduce((sum, count) => sum + count, 0)
      const data = total ? Object.entries(comptes)
        .map(([name, count]) => ({ name, value: Math.round((count / total) * 100) }))
        .sort((a, b) => b.value - a.value) : []
      return res.status(200).json({ success: true, message: 'Répartition des paiements complétés du jour', data, errors: null })
    } catch (err) {
      return erreur(res, 'Erreur lors de la récupération des moyens de paiement', err)
    }
  },

  async getEvolutionMensuelle(req, res) {
    try {
      const now = new Date()
      const mois = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (6 - index), 1)
        return { debut: date, label: date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '') }
      })
      const fin = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const trajets = await prisma.trajet.findMany({
        where: { statut: 'termine', date_heure_fin: { gte: mois[0].debut, lt: fin } },
        select: { date_heure_fin: true },
      })
      const data = mois.map(({ debut, label }) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value: trajets.filter(({ date_heure_fin }) => date_heure_fin
          && date_heure_fin.getFullYear() === debut.getFullYear()
          && date_heure_fin.getMonth() === debut.getMonth()).length,
      }))
      return res.status(200).json({ success: true, message: 'Évolution mensuelle des courses terminées', data, errors: null })
    } catch (err) {
      return erreur(res, "Erreur lors de la récupération de l'évolution mensuelle", err)
    }
  },
}

module.exports = dashboardController
