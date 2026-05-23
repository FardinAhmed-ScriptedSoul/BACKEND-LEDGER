const express = require('express');
const authMiddleware = require('../middlewares/auth.middlewares.js');
const accountController = require('../controllers/account.controller.js');


const router = express.Router();


/**
 * @route POST /api/accounts/
 * create a new account
 * @access Private
 * Protected by authMiddleware, only authenticated users can create accounts
 */

router.post("/",authMiddleware.authMiddleware, accountController.createAccountController);

/**
 * @route GET /api/accounts
 * Get all accounnts of logged-in users
 * protected route
 */

router.get("/",authMiddleware.authMiddleware,accountController.getUserAccountsController)


/**
 * @route GET /api/accounts/balance/:accountId
 */
router.get("/balance/:accountId",authMiddleware.authMiddleware,accountController.getAccountBalanceController)

module.exports = router;