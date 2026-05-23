/*
 * Central configuration manager for the application.
 * Loads environment variables and normalizes runtime settings.
 */
require('dotenv').config();

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 4000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '3d',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  REFRESH_TOKEN: process.env.REFRESH_TOKEN,
  EMAIL_USER: process.env.EMAIL_USER,
  TEST_DELAY_MS: Number(process.env.TEST_DELAY_MS) || 0,
  COOKIE_SECURE: process.env.NODE_ENV === 'production',
  SEND_EMAILS: process.env.NODE_ENV !== 'test'
};

if (!config.MONGO_URI) {
  console.error('CRITICAL ERROR: MONGO_URI environmental variable is missing.');
  process.exit(1);
}

if (!config.JWT_SECRET) {
  console.error('CRITICAL ERROR: JWT_SECRET environmental variable is missing.');
  process.exit(1);
}

if (config.SEND_EMAILS && (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET || !config.REFRESH_TOKEN || !config.EMAIL_USER)) {
  console.error('CRITICAL ERROR: Email configuration variables are missing. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REFRESH_TOKEN, and EMAIL_USER.');
  process.exit(1);
}

module.exports = config;