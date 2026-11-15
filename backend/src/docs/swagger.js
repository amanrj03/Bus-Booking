const openapiSpec = require('./openapi.json');

const SWAGGER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GoBus Bus Booking Management System — API Reference</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #131b26; font-weight: 800; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/api-docs.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true
      });
    };
  </script>
</body>
</html>`;

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

  // Interactive Swagger UI presentation
  const handleSwaggerHtml = (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(SWAGGER_HTML);
  };

  app.get('/api-docs', handleSwaggerHtml);
  app.get('/api-docs/', handleSwaggerHtml);
  app.get('/docs', handleSwaggerHtml);
  app.get('/docs/', handleSwaggerHtml);
}

module.exports = {
  setupSwagger,
  openapiSpec,
};
