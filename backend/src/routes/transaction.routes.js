const { Router } = require('express');
const { authMiddleware, authSystemUserMiddleware } = require('../middlewares/auth.middlewares.js');
const transactionController = require('../controllers/transaction.controller.js');

const transactionRoutes = Router();

/**
 * @route POST /api/transactions
 * @desc Create a new transaction (transfer funds between accounts)
 * @access Private
 */
transactionRoutes.post('/', authMiddleware, transactionController.createTransaction);

/**
 * @route POST /api/transactions/system/initial-funds
 * -Create initial funds transaction from system user
 */

transactionRoutes.post('/system/initial-funds', authSystemUserMiddleware, transactionController.createInitialFundsTransaction);
 
module.exports = transactionRoutes;