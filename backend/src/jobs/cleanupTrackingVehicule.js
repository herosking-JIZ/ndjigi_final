const { prisma } = require('../config/db');

const RETENTION_DAYS = 7;

async function cleanupTrackingVehicule() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const result = await prisma.tracking_vehicule.deleteMany({
    where: { horodatage: { lt: cutoff } },
  });

  console.log(JSON.stringify({
    event: 'cleanup_tracking_vehicule',
    deleted: result.count,
  }));

  return result.count;
}

module.exports = {
  cleanupTrackingVehicule,
};
