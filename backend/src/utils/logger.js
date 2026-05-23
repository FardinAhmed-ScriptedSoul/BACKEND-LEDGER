/**
 * Structured logger utility for production use
 */
const config = require('../config/config.js');

const logger = {
  info: (message, data = {}) => {
    if (config.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`, data);
    }
  },

  error: (message, error = {}) => {
    console.error(`[ERROR] ${message}`, error);
  },

  warn: (message, data = {}) => {
    if (config.NODE_ENV !== 'production') {
      console.warn(`[WARN] ${message}`, data);
    }
  },

  debug: (message, data = {}) => {
    if (config.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data);
    }
  }
};

module.exports = logger;
