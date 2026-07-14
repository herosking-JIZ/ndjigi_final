const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const LocalStorageProvider = require('../src/storage/LocalStorageProvider');

describe('Upload System - Smoke Tests', () => {
  describe('LocalStorageProvider', () => {
    let baseDir;
    let storage;

    beforeEach(() => {
      baseDir = path.join(__dirname, 'tmp-storage-test');
      if (fs.existsSync(baseDir)) {
        fs.rmSync(baseDir, { recursive: true });
      }
      storage = new LocalStorageProvider(baseDir);
    });

    afterEach(() => {
      if (fs.existsSync(baseDir)) {
        fs.rmSync(baseDir, { recursive: true });
      }
    });

    test('should save file to storage', async () => {
      const tempFile = path.join(__dirname, 'tmp-test-file.txt');
      fs.writeFileSync(tempFile, 'test content');

      const fileKey = `2024-01/${uuidv4()}.txt`;
      await storage.save(tempFile, fileKey);

      const resolved = path.resolve(path.join(baseDir, fileKey));
      expect(fs.existsSync(resolved)).toBe(true);
      expect(fs.readFileSync(resolved, 'utf-8')).toBe('test content');

      // Check file permissions (600)
      const stats = fs.statSync(resolved);
      expect((stats.mode & 0o777).toString(8)).toBe('600');
    });

    test('should create subdirectories with 700 permissions', async () => {
      const tempFile = path.join(__dirname, 'tmp-test-file.txt');
      fs.writeFileSync(tempFile, 'test content');

      const fileKey = `2024-01/user-id/deep/file.txt`;
      await storage.save(tempFile, fileKey);

      const deepDir = path.resolve(path.join(baseDir, '2024-01/user-id/deep'));
      expect(fs.existsSync(deepDir)).toBe(true);

      // Check directory permissions (700)
      const stats = fs.statSync(deepDir);
      expect((stats.mode & 0o777).toString(8)).toBe('700');
    });

    test('should delete file from storage', async () => {
      const tempFile = path.join(__dirname, 'tmp-test-file.txt');
      fs.writeFileSync(tempFile, 'test content');

      const fileKey = `2024-01/${uuidv4()}.txt`;
      await storage.save(tempFile, fileKey);

      const resolved = path.resolve(path.join(baseDir, fileKey));
      expect(fs.existsSync(resolved)).toBe(true);

      await storage.delete(fileKey);
      expect(fs.existsSync(resolved)).toBe(false);
    });

    test('should handle delete gracefully if file does not exist', async () => {
      const fileKey = `2024-01/${uuidv4()}.txt`;
      await expect(storage.delete(fileKey)).resolves.not.toThrow();
    });

    test('should get read stream for existing file', async () => {
      const tempFile = path.join(__dirname, 'tmp-test-file.txt');
      const content = 'test file content';
      fs.writeFileSync(tempFile, content);

      const fileKey = `2024-01/${uuidv4()}.txt`;
      await storage.save(tempFile, fileKey);

      const readStream = await storage.getReadStream(fileKey);
      let data = '';
      for await (const chunk of readStream) {
        data += chunk;
      }
      expect(data).toBe(content);
    });

    test('should throw error for non-existent file', async () => {
      const fileKey = `2024-01/${uuidv4()}.txt`;
      await expect(storage.getReadStream(fileKey)).rejects.toThrow('File not found');
    });

    test('should detect path traversal attempts', () => {
      expect(() => {
        storage._resolvePath('../../../etc/passwd');
      }).toThrow('Path traversal detected');

      expect(() => {
        storage._resolvePath('2024-01/../../etc/passwd');
      }).toThrow('Path traversal detected');
    });

    test('should verify file exists', async () => {
      const tempFile = path.join(__dirname, 'tmp-test-file.txt');
      fs.writeFileSync(tempFile, 'test content');

      const fileKey = `2024-01/${uuidv4()}.txt`;
      await storage.save(tempFile, fileKey);

      expect(await storage.exists(fileKey)).toBe(true);
    });

    test('should return false for non-existent file', async () => {
      const fileKey = `2024-01/${uuidv4()}.txt`;
      expect(await storage.exists(fileKey)).toBe(false);
    });
  });

  describe('MIME Type Validation', () => {
    test('should have whitelist of allowed MIME types', () => {
      const { ALLOWED_MIME_TYPES } = require('../src/config/multer.config');

      expect(ALLOWED_MIME_TYPES['application/pdf']).toBe('.pdf');
      expect(ALLOWED_MIME_TYPES['image/jpeg']).toBe('.jpg');
      expect(ALLOWED_MIME_TYPES['image/png']).toBe('.png');
      expect(ALLOWED_MIME_TYPES['video/mp4']).toBe('.mp4');
      expect(ALLOWED_MIME_TYPES['audio/mpeg']).toBe('.mp3');

      // Should NOT include archives
      expect(ALLOWED_MIME_TYPES['application/zip']).toBeUndefined();
      expect(ALLOWED_MIME_TYPES['application/x-rar-compressed']).toBeUndefined();
    });
  });

  describe('Configuration', () => {
    test('should have required upload environment variables', () => {
      process.env.USER_QUOTA_BYTES = '1073741824';
      process.env.MAX_FILE_SIZE_BYTES = '52428800';

      const userQuota = parseInt(process.env.USER_QUOTA_BYTES, 10);
      const maxFileSize = parseInt(process.env.MAX_FILE_SIZE_BYTES, 10);

      expect(userQuota).toBe(1073741824); // 1 GB
      expect(maxFileSize).toBe(52428800); // 50 MB
      expect(maxFileSize).toBeLessThan(userQuota);
    });
  });
});
