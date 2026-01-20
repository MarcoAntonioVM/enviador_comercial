const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Enviador Comercial API',
      version: '1.0.0',
      description: 'API REST para Sistema de Automatización de Envío de Credenciales Comerciales',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server'
      },
      {
        url: 'https://api.production.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            role: { type: 'string', enum: ['admin', 'commercial', 'viewer'], example: 'commercial' },
            active: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Prospect: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            company: { type: 'string' },
            sector_id: { type: 'integer' },
            phone: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive', 'bounced', 'spam_reported', 'unsubscribed'] },
            consent_status: { type: 'string', enum: ['unknown', 'granted', 'revoked'] }
          }
        },
        Campaign: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string' },
            description: { type: 'string' },
            template_id: { type: 'integer' },
            sender_id: { type: 'integer' },
            sector_id: { type: 'integer' },
            type: { type: 'string', enum: ['individual', 'massive', 'scheduled'] },
            total_recipients: { type: 'integer' },
            scheduled_at: { type: 'string', format: 'date-time' },
            started_at: { type: 'string', format: 'date-time' },
            completed_at: { type: 'string', format: 'date-time' }
          }
        },
        Sector: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Technology' },
            description: { type: 'string' },
            active: { type: 'boolean', example: true }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      { name: 'Authentication', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management' },
      { name: 'Prospects', description: 'Prospect management' },
      { name: 'Campaigns', description: 'Campaign management' },
      { name: 'Sectors', description: 'Sector management' },
      { name: 'Templates', description: 'Email template management' },
      { name: 'Senders', description: 'Sender configuration' }
    ]
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Enviador Comercial API Docs'
  }));
};

module.exports = { setupSwagger, specs };
