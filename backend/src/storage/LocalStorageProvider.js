const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const StorageProvider = require('./StorageProvider');

class LocalStorageProvider extends StorageProvider {
  constructor(baseDir) {
    super();
    this.baseDir = path.resolve(baseDir);
    // Ensure base directory exists with 700 permissions
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true, mode: 0o700 });
    }
  }

  _resolvePath(key) {
    const resolved = path.resolve(path.join(this.baseDir, key));
    // Prevent path traversal: ensure resolved path is within baseDir
    if (!resolved.startsWith(this.baseDir + path.sep) && resolved !== this.baseDir) {
      throw new Error(`Path traversal detected: ${key}`);
    }
    return resolved;
  }

  async save(tempPath, finalKey) {
    try {
      const finalPath = this._resolvePath(finalKey);
      const finalDir = path.dirname(finalPath);

      // Create subdirectories with 700 permissions
      if (!fs.existsSync(finalDir)) {
        fs.mkdirSync(finalDir, { recursive: true, mode: 0o700 });
      }

      // Move file from temp to final location
      await fs.promises.rename(tempPath, finalPath);

      // Set permissions to 600 (owner read/write only)
      await fs.promises.chmod(finalPath, 0o600);
    } catch (error) {
      throw new Error(`Failed to save file: ${error.message}`);
    }
  }

  async delete(key) {
    try {
      const filePath = this._resolvePath(key);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      // No error if file doesn't exist (idempotent)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`Failed to delete file: ${error.message}`);
      }
    }
  }

  async getReadStream(key) {
    const filePath = this._resolvePath(key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${key}`);
    }
    return fs.createReadStream(filePath);
  }

  async exists(key) {
    try {
      const filePath = this._resolvePath(key);
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }
}

module.exports = LocalStorageProvider;
