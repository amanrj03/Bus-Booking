import app from './app';
import { httpServerHandler } from 'cloudflare:node';
import { env } from 'cloudflare:workers';

const server = app.listen(0);
const handler = httpServerHandler(server);

export default {
  async fetch(request, workerEnv, ctx) {
    const activeEnv = workerEnv || env;
    if (activeEnv) {
      if (activeEnv.DATABASE_URL) process.env.DATABASE_URL = activeEnv.DATABASE_URL;
      if (activeEnv.JWT_SECRET) process.env.JWT_SECRET = activeEnv.JWT_SECRET;
      if (activeEnv.FRONTEND_URL) process.env.FRONTEND_URL = activeEnv.FRONTEND_URL;
    }
    return handler.fetch(request, activeEnv, ctx);
  },
};
