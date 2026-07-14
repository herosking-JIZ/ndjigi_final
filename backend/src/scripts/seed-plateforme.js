require('dotenv').config()
const { prisma } = require('../config/db');
async function main() {
  console.log('🌱 Création de l\'utilisateur système plateforme...')

  const plateforme = await prisma.utilisateur.upsert({
    where: { email: 'systeme@ndjigi.com' },
    update: {},
    create: {
      email:            'systeme@ndjigi.com',
      numero_telephone: '+22600000000',
      nom:              'Ndjigi',
      prenom:           'Système',
      mot_de_passe_hash: '$INACCESSIBLE$',
      statut_compte:    'systeme',
      portefeuille: {
        create: {
          solde:           0,
          dette_commission: 0,
          devise:          'XOF',
          statut:          'actif',
        },
      },
    },
    include: { portefeuille: true },
  })

  console.log('✅ Utilisateur système créé')
  console.log('   id_utilisateur  :', plateforme.id_utilisateur)
  console.log('   id_portefeuille :', plateforme.portefeuille.id_portefeuille)
  console.log('')
  console.log('👉 Copie ces valeurs dans ton .env :')
  console.log(`   PLATEFORME_USER_ID=${plateforme.id_utilisateur}`)
  console.log(`   PLATEFORME_WALLET_ID=${plateforme.portefeuille.id_portefeuille}`)
}

main()
  .catch((e) => { console.error('❌ Erreur seed :', e); process.exit(1) })
  .finally(() => prisma.$disconnect())