import app from './app';
import { httpServerHandler } from 'cloudflare:node';

const server = app.listen(0);
const handler = httpServerHandler(server);

export default {
  async fetch(request, env, ctx) {
    if (env) {
      if (env.DATABASE_URL) process.env.DATABASE_URL = env.DATABASE_URL;
      if (env.JWT_SECRET) process.env.JWT_SECRET = env.JWT_SECRET;
      if (env.FRONTEND_URL) process.env.FRONTEND_URL = env.FRONTEND_URL;
    }
    return handler.fetch(request, env, ctx);
  },
};
