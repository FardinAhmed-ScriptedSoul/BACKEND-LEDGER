/**
 * Transaction utilities - handles transaction logic
 */
const transactionModel = require('../models/transaction.model.js');
const ledgerModel = require('../models/ledger.model.js');
const config = require('../config/config.js');
const logger = require('./logger.js');

/**
 * Create ledger entries for a transaction
 */
const createLedgerEntries = async (session, fromAccountId, toAccountId, amount, transactionId) => {
  await ledgerModel.create([
    {
      account: fromAccountId,
      amount,
      transaction: transactionId,
      type: 'DEBIT'
    }
  ], { session });

  await ledgerModel.create([
    {
      account: toAccountId,
      amount,
      transaction: transactionId,
      type: 'CREDIT'
    }
  ], { session });
};

/**
 * Apply test delay for race condition testing
 */
const applyTestDelay = async () => {
  const rawDelay = process.env.TEST_DELAY_MS ?? config.TEST_DELAY_MS;
  const parsedDelay = Number(rawDelay);
  const testDelay = Number.isFinite(parsedDelay) ? Math.min(Math.max(parsedDelay, 0), 5000) : 0;
  if (testDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, testDelay));
    logger.debug(`Applied transaction test delay of ${testDelay}ms`);
  }
};

/**
 * Mark transaction as failed
 */
const markTransactionFailed = async (transactionId) => {
  if (transactionId) {
    try {
      await transactionModel.findByIdAndUpdate(transactionId, { status: 'FAILED' });
    } catch (err) {
      logger.error('Failed to mark transaction as failed', err);
    }
  }
};

module.exports = {
  createLedgerEntries,
  applyTestDelay,
  markTransactionFailed
};
