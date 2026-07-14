// Abstract interface for storage providers
class StorageProvider {
  async save(tempPath, finalKey) {
    throw new Error('save() must be implemented');
  }

  async delete(key) {
    throw new Error('delete() must be implemented');
  }

  async getReadStream(key) {
    throw new Error('getReadStream() must be implemented');
  }

  async exists(key) {
    throw new Error('exists() must be implemented');
  }
}

module.exports = StorageProvider;
