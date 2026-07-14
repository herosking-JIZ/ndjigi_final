#!/usr/bin/env node
/**
 * Script pour créer un utilisateur admin de test dans Keycloak
 * Usage: node create-test-admin.js
 */

const axios = require('axios');

const KEYCLOAK_URL = 'http://localhost:8080';
const KEYCLOAK_REALM = 'ndjigi';
const KEYCLOAK_CLIENT_ID = 'ndjigi-backend';
const KEYCLOAK_CLIENT_SECRET = 'G86nsu5BwsbS5no2HB76HWuTmprCorte';

const TEST_ADMIN = {
  email: 'admin@ndjigi.test',
  username: 'admin',
  firstName: 'Test',
  lastName: 'Admin',
  password: 'Admin@12345'
};

async function getAdminToken() {
  try {
    const response = await axios.post(
      `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
      {
        client_id: KEYCLOAK_CLIENT_ID,
        client_secret: KEYCLOAK_CLIENT_SECRET,
        grant_type: 'client_credentials'
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Erreur lors de l\'obtention du token admin:', error.message);
    throw error;
  }
}

async function createUser(token) {
  try {
    const response = await axios.post(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users`,
      {
        email: TEST_ADMIN.email,
        username: TEST_ADMIN.username,
        firstName: TEST_ADMIN.firstName,
        lastName: TEST_ADMIN.lastName,
        enabled: true,
        emailVerified: true,
        credentials: [
          {
            type: 'password',
            value: TEST_ADMIN.password,
            temporary: false
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Récupérer l'ID utilisateur depuis le header Location
    const userId = response.headers.location.split('/').pop();
    console.log(`✅ Utilisateur créé avec succès: ${userId}`);
    return userId;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  Utilisateur existe déjà');
      // Récupérer l'utilisateur existant
      return getUserId(token);
    }
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error.response?.data || error.message);
    throw error;
  }
}

async function getUserId(token) {
  try {
    const response = await axios.get(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?username=${TEST_ADMIN.username}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.data.length > 0) {
      return response.data[0].id;
    }
    throw new Error('Utilisateur non trouvé');
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error.message);
    throw error;
  }
}

async function assignAdminRole(token, userId) {
  try {
    // D'abord, obtenir l'ID du rôle "ndjigi-admin"
    const rolesResponse = await axios.get(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/roles?search=ndjigi-admin`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (rolesResponse.data.length === 0) {
      console.log('⚠️  Rôle "ndjigi-admin" non trouvé. Assignation du rôle "admin" à la place.');
      // Essayer le rôle "admin"
      await assignRoleByName(token, userId, 'admin');
      return;
    }

    const adminRole = rolesResponse.data.find(r => r.name === 'ndjigi-admin');
    if (!adminRole) {
      console.log('⚠️  Rôle "ndjigi-admin" non trouvé. Assignation du rôle "admin" à la place.');
      await assignRoleByName(token, userId, 'admin');
      return;
    }

    // Assigner le rôle
    await axios.post(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
      [
        {
          id: adminRole.id,
          name: adminRole.name,
          composite: adminRole.composite,
          clientRole: false,
          containerId: KEYCLOAK_REALM
        }
      ],
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Rôle "ndjigi-admin" assigné à ${TEST_ADMIN.username}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'assignation du rôle:', error.response?.data || error.message);
  }
}

async function assignRoleByName(token, userId, roleName) {
  try {
    const rolesResponse = await axios.get(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/roles?search=${roleName}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const role = rolesResponse.data.find(r => r.name === roleName);
    if (!role) {
      console.warn(`⚠️  Rôle "${roleName}" non trouvé`);
      return;
    }

    await axios.post(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
      [
        {
          id: role.id,
          name: role.name,
          composite: role.composite,
          clientRole: false,
          containerId: KEYCLOAK_REALM
        }
      ],
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Rôle "${roleName}" assigné à ${TEST_ADMIN.username}`);
  } catch (error) {
    console.error(`❌ Erreur lors de l'assignation du rôle "${roleName}":`, error.message);
  }
}

async function main() {
  console.log('📝 Création d\'un utilisateur admin de test...\n');
  console.log(`Keycloak URL: ${KEYCLOAK_URL}`);
  console.log(`Realm: ${KEYCLOAK_REALM}\n`);

  try {
    // 1. Obtenir le token admin
    console.log('1️⃣  Obtention du token admin...');
    const token = await getAdminToken();
    console.log('✅ Token obtenu\n');

    // 2. Créer l'utilisateur
    console.log('2️⃣  Création de l\'utilisateur...');
    const userId = await createUser(token);
    console.log(`✅ Utilisateur créé (ID: ${userId})\n`);

    // 3. Assigner le rôle admin
    console.log('3️⃣  Assignation du rôle admin...');
    await assignAdminRole(token, userId);
    console.log('');

    // Afficher les infos de connexion
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ UTILISATEUR ADMIN CRÉÉ AVEC SUCCÈS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${TEST_ADMIN.email}`);
    console.log(`Username: ${TEST_ADMIN.username}`);
    console.log(`Password: ${TEST_ADMIN.password}`);
    console.log('');
    console.log('🔗 URL d\'accès: http://localhost:3000/login');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();
