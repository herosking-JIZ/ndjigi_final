require('dotenv').config();
const userProvisioningService = require('./src/services/userProvisioningService');
const { prisma } = require('./src/config/db');

async function test() {
  console.log('\n🧪 ATOMICITY TEST - Test passager (no FK constraints)\n');
  const email = `test.passager.${Date.now()}@ndjigi.dev`;
  
  try {
    console.log('Creating passager...');
    const result = await userProvisioningService.create({
      email,
      nom: 'Passager',
      prenom: 'Test',
      role: 'passager',
      numero_telephone: `+2267${Math.random().toString().slice(2, 10)}`,
      sendInvitationEmail: false
    });
    
    console.log('✅ Passager created:', result.id_utilisateur);
    
    const pgUser = await prisma.utilisateur.findUnique({ where: { email } });
    console.log('✅ Found in PG:', pgUser.id_utilisateur);
    console.log('✅ Keycloak sync:', pgUser.keycloak_id === result.keycloak_id);
    
  } finally {
    await prisma.();
  }
}

test();
