const LocalStorageProvider = require('./LocalStorageProvider');

const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';
const STORAGE_LOCAL_BASE_DIR = process.env.STORAGE_LOCAL_BASE_DIR || './uploads/storage';

let storageInstance = null;

function getStorageProvider() {
  if (!storageInstance) {
    if (STORAGE_PROVIDER === 'local') {
      storageInstance = new LocalStorageProvider(STORAGE_LOCAL_BASE_DIR);
    } else {
      throw new Error(`Unsupported storage provider: ${STORAGE_PROVIDER}`);
    }
  }
  return storageInstance;
}

module.exports = {
  getStorageProvider,
  StorageProvider: require('./StorageProvider'),
  LocalStorageProvider,
};
