const app = require('./app');
const { httpServerHandler } = require('cloudflare:node');

// In Cloudflare Workers environment, adapt Express HTTP server to Worker fetch handler
const server = app.listen(0);
const handler = httpServerHandler(server);

module.exports = {
  async fetch(request, env, ctx) {
    // Populate process.env dynamically from Cloudflare Worker env bindings
    if (env) {
      if (env.DATABASE_URL) process.env.DATABASE_URL = env.DATABASE_URL;
      if (env.JWT_SECRET) process.env.JWT_SECRET = env.JWT_SECRET;
      if (env.NODE_ENV) process.env.NODE_ENV = env.NODE_ENV;
      if (env.FRONTEND_URL) process.env.FRONTEND_URL = env.FRONTEND_URL;
    }
    return handler.fetch(request, env, ctx);
  },
};
