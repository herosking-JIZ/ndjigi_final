/**
 * PRISMA/DELETE-ALL-DATA.JS
 * Development utility: Delete ALL data from database (empty schema only)
 *
 * DANGER: Only use in development environments. This is irreversible!
 *
 * Usage:
 *   node prisma/delete-all-data.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function deleteAllData() {
  const client = await pool.connect();

  try {
    console.log('⚠️  DELETING ALL DATA FROM DATABASE...');
    console.log('');

    // Safety check
    if (process.env.NODE_ENV === 'production') {
      throw new Error('❌ BLOCKED: Cannot run delete-all-data in production!');
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('❌ ERROR: DATABASE_URL not set');
    }

    // Delete all data in correct order (respecting foreign keys)
    const deleteQueries = [
      'TRUNCATE TABLE avis CASCADE',
      'TRUNCATE TABLE document CASCADE',
      'TRUNCATE TABLE trajet CASCADE',
      'TRUNCATE TABLE affectation_vehicule CASCADE',
      'TRUNCATE TABLE vehicule CASCADE',
      'TRUNCATE TABLE tarif_categorie_zone CASCADE',
      'TRUNCATE TABLE categorie_vehicule CASCADE',
      'TRUNCATE TABLE zone_tarifaire CASCADE',
      'TRUNCATE TABLE code_promo CASCADE',
      'TRUNCATE TABLE gestionnaire_parking CASCADE',
      'TRUNCATE TABLE parking CASCADE',
      'TRUNCATE TABLE chauffeur CASCADE',
      'TRUNCATE TABLE passager CASCADE',
      'TRUNCATE TABLE proprietaire CASCADE',
      'TRUNCATE TABLE portefeuille CASCADE',
      'TRUNCATE TABLE utilisateur_role CASCADE',
      'TRUNCATE TABLE utilisateur CASCADE',
      'TRUNCATE TABLE password_reset_token CASCADE',
      // Reset sequences for auto-increment IDs
      'ALTER SEQUENCE utilisateur_id_seq RESTART WITH 1',
      'ALTER SEQUENCE parking_id_seq RESTART WITH 1'
    ];

    for (const query of deleteQueries) {
      try {
        await client.query(query);
        console.log(`  ✓ ${query}`);
      } catch (error) {
        // Ignore if sequence doesn't exist
        if (!error.message.includes('does not exist')) {
          throw error;
        }
      }
    }

    console.log('');
    console.log('✅ All data deleted successfully!');
    console.log('   Database schema preserved');
    console.log('   Database is now empty');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

deleteAllData();
