/**
 * Test Setup
 * Configure mocks and test environment
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/ndjigi_test';
process.env.KEYCLOAK_URL = 'http://localhost:8080';
process.env.KEYCLOAK_REALM = 'ndjigi';
process.env.KEYCLOAK_CLIENT_ID = 'ndjigi-backend';
process.env.KEYCLOAK_CLIENT_SECRET = 'test-secret';
process.env.CRYPTO_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.APP_URL = 'http://localhost:3000';
process.env.SUPPORT_WHATSAPP = '+22606768989';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '1025';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test';

// Suppress console logs in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Increase test timeout for database operations
jest.setTimeout(10000);
