const { PrismaClient } = require('@prisma/client');
const config = require('./env');

let prismaInstance = null;

function createAdapter(connectionString) {
  // If connecting to Neon or running in serverless edge, use Neon WebSocket/HTTP adapter
  if (connectionString && connectionString.includes('neon.tech')) {
    try {
      const { Pool } = require('@neondatabase/serverless');
      const { PrismaNeon } = require('@prisma/adapter-neon');
      const pool = new Pool({ connectionString });
      return new PrismaNeon(pool);
    } catch (e) {
      // Fallback to standard PrismaPg
    }
  }

  // Standard pg driver adapter for local PostgreSQL
  const { PrismaPg } = require('@prisma/adapter-pg');
  return new PrismaPg({ connectionString });
}

function getPrisma() {
  if (!prismaInstance) {
    const adapter = createAdapter(config.databaseUrl);
    prismaInstance = new PrismaClient({
      adapter,
      log: config.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return prismaInstance;
}

// Proxy that delegates to getPrisma() while supporting test mocking (`prisma.user = ...`)
const prisma = new Proxy({}, {
  get(target, prop) {
    if (prop in target) {
      return target[prop];
    }
    const client = getPrisma();
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  },
  deleteProperty(target, prop) {
    delete target[prop];
    return true;
  },
});

module.exports = prisma;
