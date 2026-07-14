/**
 * ERRORS/MISSINGDOCUMENTSERROR.JS
 * Custom error for missing required documents in extension requests
 */

class MissingDocumentsError extends Error {
  constructor(missingDocuments = []) {
    super('Documents obligatoires manquants');
    this.name = 'MissingDocumentsError';
    this.missingDocuments = missingDocuments;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = MissingDocumentsError;
