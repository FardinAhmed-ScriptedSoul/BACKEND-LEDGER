/**
 * Auth Service - central business logic for authentication operations
 */
const userModel = require('../models/user.model.js');
const { AppError } = require('../utils/errorHandler.js');
const tokenManager = require('../utils/tokenManager.js');

const registerUser = async ({ email, password, name }) => {
  if (!email || !password || !name) {
    throw new AppError('Email, password, and name are required.', 400);
  }

  const exists = await userModel.exists({ email });
  if (exists) {
    throw new AppError('User already exists with the same email', 409);
  }

  const user = await userModel.create({ email, password, name });
  const token = tokenManager.generateToken(user._id, user.tokenVersion);

  return { user, token };
};

const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError('Email and password are required for login.', 400);
  }

  const user = await userModel.findOne({ email }).select('+password +tokenVersion');
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = tokenManager.generateToken(user._id, user.tokenVersion);
  return { user, token };
};

const logoutAllSessions = async (user) => {
  user.tokenVersion += 1;
  await user.save();
  return user;
};

module.exports = {
  registerUser,
  loginUser,
  logoutAllSessions
};
