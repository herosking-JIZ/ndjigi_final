#!/usr/bin/env node
/**
 * Script d'initialisation Keycloak
 * Crée le realm, les clients, les rôles et l'utilisateur admin
 */

const axios = require('axios');

// Use Docker internal network hostname when running in container, otherwise use localhost
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://keycloak:8080';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'Admin123456';

// Configuration initiale
const REALM_NAME = 'ndjigi';
const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL = 'admin@ndjigi.test';
const ADMIN_PASSWORD = 'Admin@12345';

let adminToken = null;

// Fonction pour attendre
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Obtenir le token admin du realm master
async function getAdminToken() {
  try {
    console.log('📝 Obtention du token admin...');
    console.log(`  URL: ${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`);
    console.log(`  Utilisateur: ${ADMIN_USER}`);

    const params = new URLSearchParams();
    params.append('client_id', 'admin-cli');
    params.append('username', ADMIN_USER);
    params.append('password', ADMIN_PASS);
    params.append('grant_type', 'password');

    const response = await axios.post(
      `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    adminToken = response.data.access_token;
    console.log('✅ Token obtenu\n');
    return adminToken;
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    throw error;
  }
}

// Créer le realm
async function createRealm() {
  try {
    console.log('1️⃣  Création du realm...');

    await axios.post(
      `${KEYCLOAK_URL}/admin/realms`,
      {
        realm: REALM_NAME,
        displayName: 'N\'DJIGI',
        enabled: true,
        accessTokenLifespan: 300,
        refreshTokenLifespan: 1800
      },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Realm créé\n');
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  Realm existe déjà\n');
    } else {
      console.error('❌ Erreur:', error.response?.data || error.message);
      throw error;
    }
  }
}

// Créer les clients
async function createClients() {
  try {
    console.log('2️⃣  Création des clients...');

    // Client backend
    try {
      await axios.post(
        `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients`,
        {
          clientId: 'ndjigi-backend',
          name: 'N\'DJIGI Backend',
          enabled: true,
          clientAuthenticatorType: 'client-secret',
          // Only takes effect on first-ever client creation (POST below 409s and no-ops if the
          // client already exists — see catch below). Not authoritative afterward: the live secret
          // is docker-compose.yml's backend.environment.KEYCLOAK_CLIENT_SECRET. If they diverge,
          // regenerate via POST /admin/realms/ndjigi/clients/{id}/client-secret and update that file.
          secret: 'G86nsu5BwsbS5no2HB76HWuTmprCorte',
          publicClient: false,
          standardFlowEnabled: true,
          serviceAccountsEnabled: true,
          directAccessGrantsEnabled: true,
          redirectUris: [
            'http://localhost:3000/*',
            'http://localhost:8000/*'
          ],
          webOrigins: [
            'http://localhost:3000',
            'http://localhost:8000'
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('  ✅ Client backend créé');
    } catch (e) {
      if (e.response?.status === 409) {
        console.log('  ⚠️  Client backend existe déjà');
      } else {
        throw e;
      }
    }

    // Client frontend
    try {
      await axios.post(
        `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients`,
        {
          clientId: 'ndjigi-web',
          name: 'N\'DJIGI Frontend',
          enabled: true,
          publicClient: true,
          redirectUris: [
            'http://localhost:3000/*',
            'http://localhost:3000'
          ],
          webOrigins: [
            'http://localhost:3000'
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('  ✅ Client frontend créé');
    } catch (e) {
      if (e.response?.status === 409) {
        console.log('  ⚠️  Client frontend existe déjà');
      } else {
        throw e;
      }
    }

    console.log('');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  }
}

// Créer les rôles
async function createRoles() {
  try {
    console.log('3️⃣  Création des rôles...');

    const roles = [
      { name: 'admin', description: 'Administrateur' },
      { name: 'ndjigi-admin', description: 'Administrateur N\'DJIGI' },
      { name: 'gestionnaire', description: 'Gestionnaire' },
      { name: 'chauffeur', description: 'Chauffeur' },
      { name: 'passager', description: 'Passager' },
      { name: 'proprietaire', description: 'Propriétaire' }
    ];

    for (const role of roles) {
      try {
        await axios.post(
          `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles`,
          role,
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`  ✅ Rôle "${role.name}" créé`);
      } catch (e) {
        if (e.response?.status === 409) {
          console.log(`  ⚠️  Rôle "${role.name}" existe déjà`);
        } else {
          throw e;
        }
      }
    }

    console.log('');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  }
}

// Créer l'utilisateur admin
async function createAdmin() {
  try {
    console.log('4️⃣  Création de l\'utilisateur admin...');

    await axios.post(
      `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users`,
      {
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        firstName: 'Test',
        lastName: 'Admin',
        enabled: true,
        emailVerified: true,
        credentials: [
          {
            type: 'password',
            value: ADMIN_PASSWORD,
            temporary: false
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Utilisateur créé\n');
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  Utilisateur existe déjà\n');
    } else {
      console.error('❌ Erreur:', error.response?.data || error.message);
      throw error;
    }
  }
}

// Assigner les rôles à l'utilisateur
async function assignRoles() {
  try {
    console.log('5️⃣  Assignation des rôles...');

    // Récupérer l'utilisateur
    const usersResponse = await axios.get(
      `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users?username=${ADMIN_USERNAME}`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      }
    );

    if (usersResponse.data.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    const userId = usersResponse.data[0].id;

    // Récupérer les rôles
    const rolesResponse = await axios.get(
      `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      }
    );

    const adminRole = rolesResponse.data.find(r => r.name === 'admin');
    const ndjigAdminRole = rolesResponse.data.find(r => r.name === 'ndjigi-admin');

    if (!adminRole || !ndjigAdminRole) {
      console.log('❌ Rôles non trouvés');
      return;
    }

    // Assigner les rôles
    await axios.post(
      `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${userId}/role-mappings/realm`,
      [adminRole, ndjigAdminRole],
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Rôles assignés\n');
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    throw error;
  }
}

// Main
async function main() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 Initialisation Keycloak');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Vérification de la disponibilité de Keycloak...');

    // Attendre que Keycloak soit prêt
    let retries = 0;
    while (retries < 30) {
      try {
        // Essayer d'accéder à l'endpoint d'info du serveur qui ne nécessite pas d'authentification
        const response = await axios.get(`${KEYCLOAK_URL}/`, {
          validateStatus: (status) => status < 500  // Accepter les 4xx et les 2xx
        });
        if (response.status === 200 || response.status === 302) {
          break;
        }
      } catch (e) {
        // Continuer même en cas d'erreur de connexion
      }

      retries++;
      if (retries >= 30) {
        console.error('❌ Keycloak non accessible après 30 tentatives');
        process.exit(1);
      }
      console.log(`  ⏳ Tentative ${retries}/30...`);
      await sleep(2000);
    }

    console.log('✅ Keycloak accessible\n');

    // Attendre 5 secondes supplémentaires pour que Keycloak finisse d'initialiser
    console.log('⏳ Attente de l\'initialisation complète de Keycloak...');
    await sleep(5000);

    // Exécuter l'initialisation
    await getAdminToken();
    await createRealm();
    await createClients();
    await createRoles();
    await createAdmin();
    await assignRoles();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ INITIALISATION RÉUSSIE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📝 Identifiants de connexion:');
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log('');
    console.log('🔗 URLs:');
    console.log(`  Frontend:        http://localhost:3000/login`);
    console.log(`  Keycloak Admin:  http://localhost:8080/admin`);
    console.log(`  API Docs:        http://localhost:8000/api/v1/docs`);
    console.log('');
  } catch (error) {
    console.error('❌ Initialisation échouée:', error.message);
    process.exit(1);
  }
}

main();
