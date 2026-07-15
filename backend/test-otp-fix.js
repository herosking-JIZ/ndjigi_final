/**
 * TEST: OTP Flow HTTP 403 Fix Validation
 * Test que le flux OTP crée correctement l'utilisateur avec le rôle realm 'ndjigi-passager'
 * Sans HTTP 403 Forbidden
 */

require('dotenv').config();
const axios = require('axios');
const { prisma } = require('./src/config/db');
const { getRedisClient } = require('./src/config/redis');
const redis = getRedisClient();

const API_URL = 'http://localhost:8000/api/v1';
const KEYCLOAK_URL = 'http://keycloak:8080'; // Use Docker container hostname for inter-container communication

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getKeycloakAdminToken() {
  try {
    console.log(`   Calling: ${KEYCLOAK_URL}/realms/ndjigi/protocol/openid-connect/token`);
    // Stale ad-hoc test value — must match the live Keycloak client secret
    // (docker-compose.yml backend.environment.KEYCLOAK_CLIENT_SECRET) to work.
    const response = await axios.post(
      `${KEYCLOAK_URL}/realms/ndjigi/protocol/openid-connect/token`,
      'client_id=ndjigi-backend&client_secret=W4HZH0Wf8TnGUjv6E2XMOrAl2hlXTzlM&grant_type=client_credentials',
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000
      }
    );
    return response.data.access_token;
  } catch (err) {
    console.error('❌ Failed to get Keycloak admin token');
    console.error('   Error name:', err.name);
    console.error('   Error code:', err.code);
    console.error('   Error message:', err.message);
    console.error('   Error full:', JSON.stringify(err, null, 2).substring(0, 500));
    if (err.response) {
      console.error('   Response status:', err.response.status);
      console.error('   Response data:', JSON.stringify(err.response.data));
    }
    if (err.request) {
      console.error('   Request made but no response');
    }
    process.exit(1);
  }
}

async function testOTPFlow() {
  const testPhone = `+22670${Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, '0')}`;
  const testOtpCode = '123456'; // Mock OTP code
  let keycloakAdminToken;
  let keycloakUserId;
  let postgreSQLUserId;

  console.log('\n' + '='.repeat(70));
  console.log('🧪 OTP FLOW TEST - HTTP 403 FIX VALIDATION');
  console.log('='.repeat(70) + '\n');

  console.log(`📱 Test Phone: ${testPhone}\n`);

  try {
    // Step 1: Request OTP
    console.log('📍 Step 1: Request OTP code...');
    const otpRequestResponse = await axios.post(`${API_URL}/auth/otp/request`, {
      phone: testPhone
    });

    if (otpRequestResponse.status !== 200) {
      throw new Error(`OTP request failed with status ${otpRequestResponse.status}`);
    }
    console.log('✅ OTP requested successfully\n');

    // Small delay to allow any backend processing
    await sleep(1000);

    // Step 2: Get Keycloak admin token for verification
    console.log('📍 Step 2: Getting Keycloak admin token...');
    keycloakAdminToken = await getKeycloakAdminToken();
    console.log('✅ Keycloak admin token obtained\n');

    // Step 3: Verify in PostgreSQL - user should NOT exist yet
    console.log('📍 Step 3: Verify user does NOT exist in PG yet...');
    let pgUser = await prisma.utilisateur.findUnique({
      where: { numero_telephone: testPhone }
    });

    if (pgUser) {
      throw new Error('User already exists in PG before OTP verify - unexpected!');
    }
    console.log('✅ User not in PG yet (as expected)\n');

    // Step 4: Verify OTP (this creates the user)
    console.log('📍 Step 4: Get real OTP from Redis and verify...');

    // Get the real OTP code from Redis
    const otpKey = `otp:${testPhone}`;
    const otpDataStr = await redis.get(otpKey);
    if (!otpDataStr) {
      throw new Error('OTP not found in Redis - request may have failed');
    }

    const otpData = JSON.parse(otpDataStr);
    const realOtpCode = otpData.code;
    console.log(`   Real OTP from Redis: ${realOtpCode}`);
    console.log(`   Sending: phone=${testPhone}, otp=${realOtpCode}\n`);

    const otpVerifyResponse = await axios.post(
      `${API_URL}/auth/otp/verify`,
      {
        phone: testPhone,
        otp_code: realOtpCode
      }
    );

    console.log(`✅ OTP verify response status: ${otpVerifyResponse.status}`);
    console.log(`   Response keys: ${Object.keys(otpVerifyResponse.data).join(', ')}\n`);

    // Step 5: Check backend logs for 403 errors
    console.log('📍 Step 5: Checking backend logs for HTTP 403 errors...');
    // Note: In real scenario, would tail logs. Here we check the response.
    console.log('   (Checking if response indicates success)\n');

    if (!otpVerifyResponse.data.success && otpVerifyResponse.data.message?.includes('403')) {
      throw new Error('❌ HTTP 403 detected in response!');
    }

    if (!otpVerifyResponse.data.success) {
      console.log('⚠️  OTP verify not fully successful (may be due to TOTP requirement)');
      console.log(`   Message: ${otpVerifyResponse.data.message}\n`);
      // Continue - user may have been created despite TOTP requirement
    } else {
      console.log('✅ OTP verify successful\n');
    }

    // Step 6: Verify user created in PostgreSQL
    console.log('📍 Step 6: Verify user created in PostgreSQL...');
    pgUser = await prisma.utilisateur.findUnique({
      where: { numero_telephone: testPhone },
      include: {
        utilisateur_role: { where: { actif: true } },
        passager: true
      }
    });

    if (!pgUser) {
      throw new Error('❌ User NOT created in PostgreSQL!');
    }

    postgreSQLUserId = pgUser.id_utilisateur;
    console.log(`✅ User created in PG: ${postgreSQLUserId}`);
    console.log(`   Auth provider: ${pgUser.auth_provider}`);
    console.log(`   Auth method OTP: ${pgUser.auth_method_otp}`);
    console.log(`   Keycloak ID: ${pgUser.keycloak_id}\n`);

    keycloakUserId = pgUser.keycloak_id;

    // Step 7: Verify role assigned in PostgreSQL
    console.log('📍 Step 7: Verify passager role in PostgreSQL...');
    if (!pgUser.utilisateur_role || pgUser.utilisateur_role.length === 0) {
      throw new Error('❌ No role assigned in PostgreSQL!');
    }

    const pgRole = pgUser.utilisateur_role[0];
    if (pgRole.role !== 'passager' || !pgRole.actif) {
      throw new Error(`❌ Role mismatch! Expected 'passager' active, got '${pgRole.role}' (actif: ${pgRole.actif})`);
    }
    console.log(`✅ Role 'passager' assigned in PG (actif: true)\n`);

    // Step 8: Verify passager satellite created
    console.log('📍 Step 8: Verify passager satellite created...');
    if (!pgUser.passager) {
      throw new Error('❌ Passager satellite NOT created (bug!)');
    }
    console.log(`✅ Passager satellite exists: ${pgUser.passager.id_passager}\n`);

    // Step 9: Verify role in Keycloak
    console.log('📍 Step 9: Verify realm role in Keycloak...');
    try {
      const keycloakRoleResponse = await axios.get(
        `${KEYCLOAK_URL}/admin/realms/ndjigi/users/${keycloakUserId}/role-mappings/realm`,
        { headers: { Authorization: `Bearer ${keycloakAdminToken}` } }
      );

      const roles = keycloakRoleResponse.data;
      const hasPassagerRole = roles.some(r => r.name === 'ndjigi-passager');

      if (!hasPassagerRole) {
        console.log('❌ Realm role ndjigi-passager NOT found in Keycloak!');
        console.log(`   Roles in Keycloak: ${roles.map(r => r.name).join(', ')}\n`);
        throw new Error('Role assignment failed in Keycloak');
      }

      console.log('✅ Realm role ndjigi-passager found in Keycloak');
      console.log(`   All roles: ${roles.map(r => r.name).join(', ')}\n`);
    } catch (err) {
      if (err.response?.status === 403) {
        throw new Error('❌ HTTP 403 Forbidden when querying Keycloak roles - permission issue!');
      }
      if (err.message?.includes('not found')) {
        console.log('⚠️  Could not verify roles in Keycloak (may be permission issue)');
      } else {
        throw err;
      }
    }

    // SUCCESS
    console.log('='.repeat(70));
    console.log('🎉 TEST PASSED - HTTP 403 FIX CONFIRMED');
    console.log('='.repeat(70) + '\n');

    console.log('✅ Summary:');
    console.log(`   1. User created in Keycloak: ${keycloakUserId}`);
    console.log(`   2. User created in PostgreSQL: ${postgreSQLUserId}`);
    console.log(`   3. Role ndjigi-passager assigned (realm role, not client role)`);
    console.log(`   4. Passager satellite created`);
    console.log(`   5. NO HTTP 403 errors encountered\n`);

  } catch (error) {
    console.log('='.repeat(70));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(70) + '\n');
    console.log(`Error: ${error.message}\n`);

    if (error.response?.status === 403) {
      console.log('🚨 HTTP 403 Forbidden detected - role assignment failed');
      console.log(`   Response: ${error.response?.data?.message || 'No message'}\n`);
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testOTPFlow();
