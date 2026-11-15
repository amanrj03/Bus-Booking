const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const config = require('./env');

let prismaInstance = null;

function getPrisma() {
  if (!prismaInstance) {
    const adapter = new PrismaPg({ connectionString: config.databaseUrl });
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
