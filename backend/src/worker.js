import { env } from 'cloudflare:workers';
import { httpServerHandler } from 'cloudflare:node';

// Synchronize Cloudflare Worker environment variables and secrets globally at top-level
if (typeof env !== 'undefined' && env) {
  globalThis.__CF_ENV__ = env;
  if (env.DATABASE_URL) process.env.DATABASE_URL = env.DATABASE_URL;
  if (env.JWT_SECRET) process.env.JWT_SECRET = env.JWT_SECRET;
  if (env.FRONTEND_URL) process.env.FRONTEND_URL = env.FRONTEND_URL;
}

import app from './app';

const server = app.listen(0);
const handler = httpServerHandler(server);

export default {
  async fetch(request, workerEnv, ctx) {
    const activeEnv = workerEnv || env;
    if (activeEnv) {
      globalThis.__CF_ENV__ = activeEnv;
      if (activeEnv.DATABASE_URL) process.env.DATABASE_URL = activeEnv.DATABASE_URL;
      if (activeEnv.JWT_SECRET) process.env.JWT_SECRET = activeEnv.JWT_SECRET;
      if (activeEnv.FRONTEND_URL) process.env.FRONTEND_URL = activeEnv.FRONTEND_URL;
    }
    return handler.fetch(request, activeEnv, ctx);
  },
};
