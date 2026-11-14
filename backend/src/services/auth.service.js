const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

/**
 * Strips sensitive fields from user objects
 * @param {object} user
 */
function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Registers a new passenger account
 * @param {{ name: string, email: string, password: string, phone?: string }} data
 */
async function registerUser({ name, email, password, phone }) {
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'PASSENGER', // Public signup strictly restricted to PASSENGER
      phone: phone || null,
    },
  });

  const token = generateToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  return {
    user: sanitizeUser(user),
    token,
  };
}

/**
 * Authenticates an existing user (Admin, Operator, or Passenger)
 * @param {{ email: string, password: string }} credentials
 */
async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      operator: {
        select: {
          id: true,
          name: true,
          companyName: true,
          isActive: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  return {
    user: sanitizeUser(user),
    token,
  };
}

/**
 * Retrieves an authenticated user's sanitized profile
 * @param {string} userId
 */
async function getUserProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      operator: {
        select: {
          id: true,
          name: true,
          companyName: true,
          isActive: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User account not found', 404);
  }

  return sanitizeUser(user);
}

/**
 * Authenticates or auto-registers a user via Google OAuth SSO
 * @param {{ email: string, name?: string, picture?: string, sub?: string }} payload
 */
async function loginWithGoogle({ email, name, picture, sub }) {
  const normalizedEmail = email.toLowerCase().trim();

  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      operator: {
        select: {
          id: true,
          name: true,
          companyName: true,
          isActive: true,
        },
      },
    },
  });

  let isNewUser = false;
  if (!user) {
    const randomPassword = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    user = await prisma.user.create({
      data: {
        name: name?.trim() || 'Google Passenger',
        email: normalizedEmail,
        passwordHash,
        role: 'PASSENGER',
      },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            companyName: true,
            isActive: true,
          },
        },
      },
    });
    isNewUser = true;
  }

  const token = generateToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  return {
    user: sanitizeUser(user),
    token,
    isNewUser,
  };
}

module.exports = {
  sanitizeUser,
  registerUser,
  loginUser,
  getUserProfile,
  loginWithGoogle,
};
