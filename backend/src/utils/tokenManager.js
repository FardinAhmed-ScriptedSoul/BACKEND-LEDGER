/**
 * Token and authentication utilities
 */
const jwt = require('jsonwebtoken');
const config = require('../config/config.js');

const generateToken = (userId, tokenVersion = 0) => {
  return jwt.sign(
    { userId, tokenVersion },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: 'strict',
    maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
  });
};

const clearTokenCookie = (res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: 'strict'
  });
};

const extractToken = (req) => {
  return req.cookies.token || req.headers.authorization?.split(' ')[1] || null;
};

module.exports = {
  generateToken,
  verifyToken,
  setTokenCookie,
  clearTokenCookie,
  extractToken
};
