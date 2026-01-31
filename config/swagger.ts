import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tabloid Backend API',
      version: '1.0.0',
      description: 'API documentation for Tabloid - a posts and announcements platform with Google OAuth authentication',
      contact: {
        name: 'API Support',
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token received from OAuth. The token is stored in browser\'s sessionStorage',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            googleId: {
              type: 'string',
              description: 'Google OAuth ID',
              example: '1234567890',
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com',
            },
            picture: {
              type: 'string',
              description: 'User profile picture URL',
              example: 'https://example.com/avatar.jpg',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'User role',
              example: 'user',
            },
          },
        },
        Post: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Post ID',
              example: '507f1f77bcf86cd799439011',
            },
            title: {
              type: 'string',
              description: 'Post title',
              example: 'My First Post',
            },
            content: {
              type: 'string',
              description: 'Post content',
              example: 'This is the content of my post...',
            },
            author: {
              type: 'object',
              properties: {
                googleId: {
                  type: 'string',
                  example: '1234567890',
                },
                name: {
                  type: 'string',
                  example: 'John Doe',
                },
                email: {
                  type: 'string',
                  example: 'john.doe@example.com',
                },
                picture: {
                  type: 'string',
                  example: 'https://example.com/avatar.jpg',
                },
                role: {
                  type: 'string',
                  example: 'user',
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Post creation timestamp',
              example: '2026-01-31T10:30:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Post last update timestamp',
              example: '2026-01-31T10:30:00Z',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
              example: 'An error occurred',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.ts', './index.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;