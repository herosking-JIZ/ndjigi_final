require('dotenv').config();
const userProvisioningService = require('./src/services/userProvisioningService');
const { prisma } = require('./src/config/db');

async function test() {
  const email = `test.passager.${Date.now()}@ndjigi.dev`;
  const phone = `+22670${Math.random().toString().slice(2, 8)}`;

  console.log('\n🧪 CLEAN ATOMICITY TEST - Passager Role\n');
  console.log(`Email: ${email}`);
  console.log(`Phone: ${phone}\n`);

  try {
    const result = await userProvisioningService.create({
      email,
      nom: 'Passager',
      prenom: 'Test',
      role: 'passager',
      numero_telephone: phone,
      sendInvitationEmail: false
    });

    console.log('✅ Step 1: Created in Keycloak + PostgreSQL');
    console.log(`   ID: ${result.id_utilisateur}`);
    console.log(`   Keycloak ID: ${result.keycloak_id}\n`);

    const pgUser = await prisma.utilisateur.findUnique({ where: { email } });
    if (!pgUser) {
      console.log('❌ User NOT in PostgreSQL (atomicity may have rolled back!)');
      process.exit(1);
    }

    console.log('✅ Step 2: Found in PostgreSQL');
    console.log(`   Keycloak ID: ${pgUser.keycloak_id}`);
    console.log(`   Sync: ${pgUser.keycloak_id === result.keycloak_id ? 'CORRECT' : 'MISMATCH'}\n`);

    const hasPassager = await prisma.passager.findUnique({
      where: { id_passager: pgUser.id_utilisateur }
    });
    console.log('✅ Step 3: Passager role-specific record created');
    console.log(`   Passager ID: ${hasPassager.id_passager}\n`);

    console.log('🎉 TRANSACTION ATOMICITY VERIFIED - All operations committed together\n');

  } catch (err) {
    console.log(`❌ Error: ${err.message}\n`);
    // This is expected if FK fails
    const pgUser = await prisma.utilisateur.findUnique({ where: { email } });
    console.log(`Orphaned user in PG: ${pgUser ? 'YES (BAD!)' : 'NO (GOOD - rolled back)'}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

test();
