/**
 * PRISMA/WIPE-USERS-DEV.JS
 * Development utility: Delete all seeded test users
 *
 * DANGER: Only use in development environments. This script cannot be undone.
 *
 * Usage:
 *   node prisma/wipe-users-dev.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../generated/prisma/index.js');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Email addresses of seeded test users
const SEEDED_EMAILS = [
  'admin@parkway.bf',
  'fatima.ouedraogo@gmail.com',
  'ibrahim.compaore@gmail.com',
  'marie.sawadogo@gmail.com',
  'seydou.kabore@gmail.com',
  'moussa.traore@gmail.com',
  'lassina.zongo@gmail.com',
  'adama.nikiema@gmail.com',
  'rasmane.ilboudo@gmail.com',
  'hamidou.ouattara@gmail.com',
  'justin.belem@gmail.com',
  'salif.coulibaly@gmail.com',
  'aissata.barry@gmail.com',
  'eric.some@parkway.bf',
  'alice.tapsoba@parkway.bf',
];

async function wipeUsers() {
  console.log('⚠️  DEVELOPMENT UTILITY: Wiping seeded test users');
  console.log('');

  // Safety check: ensure DATABASE_URL exists
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not set. Cannot proceed.');
    process.exit(1);
  }

  const userEmails = SEEDED_EMAILS.join(', ');
  console.log(`📋 Will delete ${SEEDED_EMAILS.length} seeded users:`);
  console.log(`   ${userEmails}`);
  console.log('');

  // Ask for confirmation (in production, this would be more strict)
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ BLOCKED: Cannot run wipe in production environment.');
    process.exit(1);
  }

  try {
    let deletedCount = 0;

    for (const email of SEEDED_EMAILS) {
      // Find the user
      const user = await prisma.utilisateur.findUnique({
        where: { email }
      });

      if (!user) {
        console.log(`  ~ ${email}: not found`);
        continue;
      }

      // Delete cascading records in order of dependencies
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Delete related records that reference this user
          await tx.avis.deleteMany({
            where: { OR: [{ id_evaluateur: user.id_utilisateur }, { id_evalue: user.id_utilisateur }] }
          });

          await tx.document.deleteMany({
            where: { id_utilisateur: user.id_utilisateur }
          });

          await tx.affectation_vehicule.deleteMany({
            where: { id_chauffeur: user.id_utilisateur }
          });

          await tx.gestionnaire_parking.deleteMany({
            where: { id_gestionnaire: user.id_utilisateur }
          });

          await tx.chauffeur.deleteMany({
            where: { id_chauffeur: user.id_utilisateur }
          });

          await tx.passager.deleteMany({
            where: { id_passager: user.id_utilisateur }
          });

          await tx.proprietaire.deleteMany({
            where: { id_proprietaire: user.id_utilisateur }
          });

          await tx.portefeuille.deleteMany({
            where: { id_utilisateur: user.id_utilisateur }
          });

          await tx.utilisateur_role.deleteMany({
            where: { id_utilisateur: user.id_utilisateur }
          });

          // 2. Delete the user
          await tx.utilisateur.delete({
            where: { id_utilisateur: user.id_utilisateur }
          });
        });

        console.log(`  ✓ ${email}: deleted`);
        deletedCount++;
      } catch (error) {
        console.error(`  ✗ ${email}: ${error.message}`);
      }
    }

    console.log('');
    console.log(`✅ Deleted ${deletedCount} seeded test users`);
    console.log('');
  } catch (error) {
    console.error('❌ Error during wipe:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

wipeUsers();
