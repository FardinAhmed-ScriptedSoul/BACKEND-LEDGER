const mongoose = require('mongoose');
const config = require('../config/config.js');
const logger = require('../utils/logger.js');

async function connectDB() {
  try {
    const connectionInstance = await mongoose.connect(config.MONGO_URI);
    logger.info(`MongoDB connection established`, {
      host: connectionInstance.connection.host,
      environment: config.NODE_ENV
    });
  } catch (error) {
    logger.error('MongoDB connection failure', error);
    process.exit(1); // Gracefully kill the system process if database is unavailable
  }
}

// Monitor active state connection health events across application lifecycles
/**
 * Connection Lifecycle Event Observers: mongoose.connection.on() maps real-time status infrastructure checks. If your cluster falls over or suffers a regional network drop mid-day, your application terminal logs it instantly.
 */
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection context lost. Re-establishing connection...');
});

mongoose.connection.on('error', (err) => {
  logger.error('Active MongoDB network channel error encountered', err);
});

module.exports = connectDB;