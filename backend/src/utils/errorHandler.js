/**
 * Centralized error handler utility
 * Provides consistent error response formatting
 */
const config = require('../config/config.js');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleError = (err, res) => {
  const { statusCode = 500, message } = err;
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(config.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const handleSuccess = (res, data, statusCode = 200, message = 'Success') => {
  res.status(statusCode).json({
    status: 'success',
    statusCode,
    message,
    data
  });
};

module.exports = {
  AppError,
  handleError,
  handleSuccess
};
