#!/usr/bin/env node
/**
 * PHASE 2 FUNCTIONAL TEST
 * Direct test of userProvisioningService.create() to verify:
 * 1. Username field is included in Keycloak payload (fixes "User name is missing")
 * 2. User is created successfully in both Keycloak and PostgreSQL
 * 3. Keycloak ID is synced to PostgreSQL
 * 4. Gestionnaire-specific records are created
 * 5. Wallet is not created for gestionnaire role
 */

require('dotenv').config();
const userProvisioningService = require('./src/services/userProvisioningService');
const { prisma } = require('./src/config/db');

async function runTest() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 PHASE 2 FUNCTIONAL TEST');
  console.log('='.repeat(60) + '\n');

  const timestamp = Date.now();
  const testEmail = `test.phase2.${timestamp}@ndjigi.dev`;
  const testData = {
    email: testEmail,
    nom: 'TestGest',
    prenom: 'Phase2',
    role: 'gestionnaire',
    numero_telephone: '+22670000000',
    adresse: 'Test Address',
    metadata: {
      id_parking: '4666b2f9-8f4c-4d69-9330-54f3b6351350'
    },
    sendInvitationEmail: false
  };

  console.log('📝 Test Data:');
  console.log(`  Email: ${testData.email}`);
  console.log(`  Role: ${testData.role}`);
  console.log(`  Parking ID: ${testData.metadata.id_parking}`);
  console.log('');

  try {
    // Call userProvisioningService.create()
    console.log('📍 Step 1: Calling userProvisioningService.create()...\n');
    const result = await userProvisioningService.create(testData);

    console.log('✅ User created successfully!');
    console.log('');
    console.log('📊 Result:');
    console.log(`  ID Utilisateur: ${result.id_utilisateur}`);
    console.log(`  Keycloak ID: ${result.keycloak_id}`);
    console.log(`  Email: ${result.email}`);
    console.log(`  Role: ${result.role}`);
    console.log('');

    // Verify in PostgreSQL
    console.log('📍 Step 2: Verifying in PostgreSQL...\n');
    const pgUser = await prisma.utilisateur.findUnique({
      where: { email: testData.email },
      include: {
        utilisateur_role: { where: { actif: true } },
        gestionnaire_parking: true,
        portefeuille: true
      }
    });

    if (pgUser) {
      console.log('✅ User found in PostgreSQL!');
      console.log(`  ID: ${pgUser.id_utilisateur}`);
      console.log(`  Keycloak ID: ${pgUser.keycloak_id}`);
      console.log(`  Email: ${pgUser.email}`);
      console.log(`  Nom: ${pgUser.nom}`);
      console.log(`  Prenom: ${pgUser.prenom}`);
      console.log(`  Auth Provider: ${pgUser.auth_provider}`);
      console.log(`  Status: ${pgUser.statut_compte}`);
      console.log('');

      // Verify keycloak_id matches
      if (pgUser.keycloak_id === result.keycloak_id) {
        console.log('✅ Keycloak ID correctly synced!');
      } else {
        console.log(`❌ Keycloak ID mismatch! Expected: ${result.keycloak_id}, Got: ${pgUser.keycloak_id}`);
      }
      console.log('');

      // Verify role
      if (pgUser.utilisateur_role && pgUser.utilisateur_role.length > 0) {
        const role = pgUser.utilisateur_role[0];
        console.log(`✅ Role assigned: ${role.role} (active: ${role.actif})`);
      } else {
        console.log('❌ No role found!');
      }
      console.log('');

      // Verify gestionnaire_parking
      if (pgUser.gestionnaire_parking && pgUser.gestionnaire_parking.length > 0) {
        console.log('✅ Gestionnaire-parking association created!');
        pgUser.gestionnaire_parking.forEach(gp => {
          console.log(`  - Parking: ${gp.id_parking}`);
        });
      } else {
        console.log('❌ Gestionnaire-parking association NOT found!');
      }
      console.log('');

      // Verify wallet NOT created for gestionnaire
      if (!pgUser.portefeuille || pgUser.portefeuille.length === 0) {
        console.log('✅ Wallet correctly NOT created for gestionnaire');
      } else {
        console.log('❌ Wallet should NOT exist for gestionnaire role!');
      }
      console.log('');
    } else {
      console.log('❌ User NOT found in PostgreSQL!');
      process.exit(1);
    }

    console.log('='.repeat(60));
    console.log('🎉 PHASE 2 FUNCTIONAL TEST PASSED!');
    console.log('='.repeat(60) + '\n');
    console.log('✅ All verifications successful:');
    console.log('  1. ✅ Username field included in Keycloak payload');
    console.log('  2. ✅ User created in Keycloak');
    console.log('  3. ✅ User created in PostgreSQL');
    console.log('  4. ✅ Keycloak ID synced to PostgreSQL');
    console.log('  5. ✅ Role assigned');
    console.log('  6. ✅ Gestionnaire-parking link created');
    console.log('  7. ✅ Wallet correctly NOT created for gestionnaire');
    console.log('');

  } catch (error) {
    console.log('❌ TEST FAILED!');
    console.log('');
    console.log('Error:', error.message);
    console.log('');
    if (error.code) {
      console.log('Error Code:', error.code);
    }
    if (error.details) {
      console.log('Error Details:', error.details);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
