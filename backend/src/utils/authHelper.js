/**
 * Shared authentication utilities
 */
const tokenBlackListModel = require('../models/blackList.model.js');
const userModel = require('../models/user.model.js');
const tokenManager = require('./tokenManager.js');
const { AppError } = require('./errorHandler.js');

const extractToken = (req) => {
  const token = tokenManager.extractToken(req);
  if (!token) {
    throw new AppError('Not authorized, token missing', 401);
  }
  return token;
};

const isTokenBlacklisted = async (token) => {
  return !!(token && await tokenBlackListModel.exists({ token }));
};

const verifyTokenPayload = (token) => {
  try {
    return tokenManager.verifyToken(token);
  } catch (error) {
    throw new AppError('Not authorized, invalid token', 401);
  }
};

const validateUserFromToken = async (decoded, selectFields = '+tokenVersion') => {
  const user = await userModel.findById(decoded.userId).select(selectFields);
  if (!user) {
    throw new AppError('User no longer exists', 401);
  }

  const currentDbVersion = user.tokenVersion ?? 0;
  const currentTokenVersion = decoded.tokenVersion ?? 0;

  if (currentDbVersion !== currentTokenVersion) {
    throw new AppError('Session expired or invalidated. Please login again.', 401);
  }

  return user;
};

const blacklistToken = async (token) => {
  if (!token) {
    throw new AppError('Token is required to blacklist.', 400);
  }

  await tokenBlackListModel.create({ token });
};

module.exports = {
  extractToken,
  isTokenBlacklisted,
  verifyTokenPayload,
  validateUserFromToken,
  blacklistToken
};
