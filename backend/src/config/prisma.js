const { PrismaClient } = require('@prisma/client');
const config = require('./env');

let prismaInstance = null;
let currentDbUrl = null;

function sanitizeConnectionString(rawUrl) {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl);
    // Remove channel_binding because WebSocket proxying does not support SCRAM channel binding
    url.searchParams.delete('channel_binding');
    return url.toString();
  } catch {
    return rawUrl;
  }
}

function createAdapter(rawConnectionString) {
  if (!rawConnectionString) return null;

  const connectionString = sanitizeConnectionString(rawConnectionString);

  // If connecting to Neon or running in serverless edge, use Neon adapter
  if (connectionString.includes('neon.tech') || (typeof globalThis !== 'undefined' && globalThis.__CF_ENV__)) {
    try {
      const { neonConfig } = require('@neondatabase/serverless');
      // Enable HTTP fetch pooling to prevent WebSocket drops and socket termination in Cloudflare isolates
      neonConfig.poolQueryViaFetch = true;
      if (typeof WebSocket !== 'undefined' && !neonConfig.webSocketConstructor) {
        neonConfig.webSocketConstructor = WebSocket;
      }
    } catch {}

    const { PrismaNeon } = require('@prisma/adapter-neon');
    // In Prisma 7, PrismaNeon accepts the connection config object { connectionString } directly
    return new PrismaNeon({ connectionString });
  }

  // Standard pg driver adapter for local PostgreSQL
  const { PrismaPg } = require('@prisma/adapter-pg');
  return new PrismaPg({ connectionString });
}

function getPrisma() {
  const activeUrl = config.databaseUrl;
  const isEdge = typeof globalThis !== 'undefined' && Boolean(globalThis.__CF_ENV__);

  // In Cloudflare edge isolates, persistent WebSockets are dropped between request lifecycles.
  // Creating the adapter per request guarantees fresh, clean network streams without "Connection terminated".
  if (isEdge) {
    const adapter = createAdapter(activeUrl);
    return new PrismaClient({
      adapter,
      log: ['error'],
    });
  }

  // In standard local Node.js environment, reuse the client instance
  if (!prismaInstance || currentDbUrl !== activeUrl) {
    currentDbUrl = activeUrl;
    const adapter = createAdapter(activeUrl);
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
