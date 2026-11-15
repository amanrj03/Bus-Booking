const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const routes = require('./routes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');
const { setupSwagger } = require('./docs/swagger');

const app = express();

// Flexible CORS configuration supporting local dev, production Vercel domains, and comma-separated lists
const allowedOrigins = (config.frontendUrl || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, supertest, server-to-server)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/+$/, '');
    // Allow if in explicitly listed origins, ends with .vercel.app, or localhost
    const isAllowed =
      allowedOrigins.includes(cleanOrigin) ||
      cleanOrigin.endsWith('.vercel.app') ||
      cleanOrigin.startsWith('http://localhost:') ||
      cleanOrigin.startsWith('http://127.0.0.1:');

    if (isAllowed || config.nodeEnv !== 'production') {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Bus Booking Management System API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/api/v1/health',
  });
});

// Swagger UI & OpenAPI Specification
setupSwagger(app);

// API v1 routes
app.use('/api/v1', routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;
