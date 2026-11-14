const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./openapi.json');

/**
 * Configures interactive Swagger UI and OpenAPI 3.0 specification endpoints.
 * - Swagger UI: GET /api-docs (and alias /docs)
 * - Raw OpenAPI 3.0 JSON: GET /api-docs.json
 */
function setupSwagger(app) {
  // Raw OpenAPI 3.0 specification in JSON format
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(openapiSpec);
  });

  // Swagger UI presentation
  const swaggerOptions = {
    customSiteTitle: 'GoBus Bus Booking Management System — API Reference',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { color: #131b26; font-weight: 800; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
    },
  };

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, swaggerOptions));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, swaggerOptions));
}

module.exports = {
  setupSwagger,
  openapiSpec,
};

