const { Router } = require('express');
const { authMiddleware } = require('../middlewares/auth.middlewares.js');
const transactionController = require('../controllers/transaction.controller.js');

const transactionRoutes = Router();

/**
 * @route POST /api/transactions
 * @desc Create a new transaction (transfer funds between accounts)
 * @access Private
 */
transactionRoutes.post('/', authMiddleware, transactionController.createTransaction);
 
module.exports = transactionRoutes;