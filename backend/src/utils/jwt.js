const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Generates a signed JWT token for an authenticated user
 * @param {{ userId: string, role: string, email: string }} payload
 * @returns {string}
 */
function generateToken(payload) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/**
 * Verifies and decodes a JWT token
 * @param {string} token
 * @returns {object}
 */
function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = {
  generateToken,
  verifyToken,
};
