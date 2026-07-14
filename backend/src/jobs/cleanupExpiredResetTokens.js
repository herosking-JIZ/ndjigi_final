const { prisma } = require('../config/db');

async function cleanupExpiredResetTokens() {
  const now = Date.now();
  const expiredCutoff = new Date(now - 24 * 60 * 60 * 1000);
  const usedCutoff = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const expiredDeleteResult = await prisma.password_reset_token.deleteMany({
    where: {
      expires_at: {
        lt: expiredCutoff
      }
    }
  });

  const usedDeleteResult = await prisma.password_reset_token.deleteMany({
    where: {
      used_at: {
        not: null,
        lt: usedCutoff
      }
    }
  });

  const deletedCount = (expiredDeleteResult?.count || 0) + (usedDeleteResult?.count || 0);

  console.log(JSON.stringify({
    event: 'cleanup_expired_reset_tokens',
    deleted_expired: expiredDeleteResult?.count || 0,
    deleted_used: usedDeleteResult?.count || 0,
    deleted_total: deletedCount
  }));

  return {
    deleted_expired: expiredDeleteResult?.count || 0,
    deleted_used: usedDeleteResult?.count || 0,
    deleted_total: deletedCount
  };
}

module.exports = {
  cleanupExpiredResetTokens
};
