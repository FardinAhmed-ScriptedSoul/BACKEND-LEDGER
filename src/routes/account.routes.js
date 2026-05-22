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



module.exports = router;