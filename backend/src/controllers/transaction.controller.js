/**
 * Transaction Controller - Clean layer delegating to service
 */

const { processTransfer, processInitialFunds } = require('../services/transaction.services.js');
const logger = require('../utils/logger.js');

/**
 * Create a new transfer transaction
 * @route POST /api/transactions
 */
async function createTransaction(req, res) {
  try {
    const { amount, fromAccountId, toAccountId, idempotencyKey } = req.body;

    if (!amount || !fromAccountId || !toAccountId) {
      return res.status(400).json({ error: 'Amount, fromAccountId, and toAccountId are required.' });
    }

    const result = await processTransfer(fromAccountId, toAccountId, amount, idempotencyKey, req.user.email, req.user.name);
    return res.status(result.status).json({ message: result.message, transaction: result.transaction });
  } catch (err) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    logger.error('Transaction creation failed', err);
    return res.status(500).json({ error: 'Transaction failed', details: err.message });
  }
}

/**
 * Create initial funds transaction from system user
 * @route POST /api/transactions/system/initial-funds
 */
async function createInitialFundsTransaction(req, res) {
  try {
    const result = await processInitialFunds(
      req.body.toAccount,
      req.body.amount,
      req.body.idempotencyKey,
      req.user._id,
      req.user.name
    );

    return res.status(result.status).json({ message: result.message, transaction: result.transaction });
  } catch (err) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    logger.error('Initial funds transaction creation failed', err);
    return res.status(500).json({ error: 'Initial funds transaction failed', details: err.message });
  }
}

module.exports = {
  createTransaction,
  createInitialFundsTransaction
};