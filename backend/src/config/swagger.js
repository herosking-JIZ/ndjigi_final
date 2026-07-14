/**
 * Swagger/OpenAPI Configuration
 * Generates API documentation accessible at /api/v1/docs
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: "N'DJIGI Authentication API",
      version: '1.0.0',
      description: 'Complete authentication system with Keycloak, OTP SMS, and TOTP 2FA',
      contact: {
        name: 'Platform Team',
        email: 'support@ndjigi.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000/api/v1',
        description: 'Development Server',
      },
      {
        url: 'https://api.ndjigi.com/api/v1',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Access Token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error description',
            },
            code: {
              type: 'string',
              example: 'ERROR_CODE',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id_utilisateur: {
              type: 'string',
              format: 'uuid',
            },
            keycloak_id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            nom: {
              type: 'string',
            },
            prenom: {
              type: 'string',
            },
            numero_telephone: {
              type: 'string',
            },
            auth_provider: {
              type: 'string',
              enum: ['keycloak', 'email'],
            },
          },
        },
        TokenResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                access_token: {
                  type: 'string',
                },
                refresh_token: {
                  type: 'string',
                },
                expires_in: {
                  type: 'integer',
                  example: 300,
                },
                token_type: {
                  type: 'string',
                  example: 'Bearer',
                },
                user: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
