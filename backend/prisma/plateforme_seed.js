// scripts/seed-plateforme.js
const { PrismaClient } = require('../generated/prisma')
const prisma = new PrismaClient()

async function main() {
  const plateforme = await prisma.utilisateur.upsert({
    where: { email: 'systeme@ndjigi.com' },
    update: {},
    create: {
      email:            'systeme@ndjigi.com',
      numero_telephone: '+22600000000',
      nom:              'Ndjigi',
      prenom:           'Système',
      mot_de_passe_hash:'$INACCESSIBLE$', // jamais utilisé pour login
      statut_compte:    'actif',
      portefeuille: {
        create: { solde: 0, devise: 'XOF' }
      }
    }
  })
  console.log('Portefeuille plateforme créé :', plateforme.id_utilisateur)
}

main()