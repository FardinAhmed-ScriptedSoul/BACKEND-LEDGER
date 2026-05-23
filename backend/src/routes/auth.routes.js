const express = require('express');
const authController = require('../controllers/auth.controller.js');
const { protect } = require('../middlewares/auth.middlewares.js');
const router = express.Router();

/**
 * POST /api/auth/register
 */
router.post("/register", authController.userRegisterController);

/**
 * POST /api/auth/login
 */
router.post("/login", authController.userLoginController);

/**
 * POST /api/auth/logout
 */
router.post("/logout", protect, authController.userLogoutController);

/**
 * POST /api/auth/logout-all
 */
router.post("/logout-all", protect, authController.userLogoutAllController);


/**
 * POST /api/auth/logout/blacklist
 */
router.post("/logout/blacklist",protect,authController.userLogoutBlacklistToken)
module.exports = router;