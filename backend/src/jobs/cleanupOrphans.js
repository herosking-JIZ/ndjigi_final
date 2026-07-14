const { prisma } = require('../config/db');
const { getStorageProvider } = require('../storage');

const ONE_HOUR_AGO = new Date(Date.now() - 60 * 60 * 1000);

// Cleanup documents stuck in PENDING state for >1 hour
async function cleanupOrphans() {
  try {
    const storage = getStorageProvider();

    // Find orphaned documents
    const orphans = await prisma.document.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: ONE_HOUR_AGO,
        },
      },
    });

    if (orphans.length === 0) {
      console.log('[cleanupOrphans] No orphaned documents found.');
      return { deleted: 0 };
    }

    // Delete from storage and DB
    let deleted = 0;
    for (const orphan of orphans) {
      try {
        // Delete from storage
        if (orphan.fileKey) {
          await storage.delete(orphan.fileKey);
        }

        // Delete from DB
        await prisma.document.delete({
          where: { id_document: orphan.id_document },
        });

        deleted++;
      } catch (error) {
        console.error(
          `[cleanupOrphans] Failed to delete orphan ${orphan.id_document}:`,
          error.message
        );
      }
    }

    console.log(`[cleanupOrphans] Deleted ${deleted} orphaned documents.`);
    return { deleted };
  } catch (error) {
    console.error('[cleanupOrphans] Error:', error);
    throw error;
  }
}

module.exports = {
  cleanupOrphans,
};
