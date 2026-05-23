const logger = require('../utils/logger.js');
const {
  extractToken,
  isTokenBlacklisted,
  verifyTokenPayload,
  validateUserFromToken
} = require('../utils/authHelper.js');

const handleAuthentication = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({ message: 'Unauthorized token is invalid' });
    }

    const decoded = verifyTokenPayload(token);
    const user = await validateUserFromToken(decoded);

    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error', error);
    return res.status(error.statusCode || 401).json({
      status: 'failed',
      message: error.message || 'Not authorized, invalid token'
    });
  }
};

const protect = handleAuthentication;
const authMiddleware = handleAuthentication;

const authSystemUserMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({ message: 'Unauthorized token is invalid' });
    }

    const decoded = verifyTokenPayload(token);
    const user = await validateUserFromToken(decoded, '+tokenVersion +systemUser');

    if (!user.systemUser) {
      return res.status(403).json({ message: 'Forbidden: This route is only for system users' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('authSystemUserMiddleware error', error);
    return res.status(error.statusCode || 401).json({
      status: 'failed',
      message: error.message || 'Unauthorized access: token missing or invalid'
    });
  }
};

module.exports = { protect, authMiddleware, authSystemUserMiddleware };