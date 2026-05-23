/**
 * Transaction Service - Business logic layer for transactions
 */

const transactionModel = require('../models/transaction.model.js');
const ledgerModel = require('../models/ledger.model.js');
const accountModel = require('../models/account.model.js');
const mongoose = require('mongoose');
const { createLedgerEntries, applyTestDelay, markTransactionFailed } = require('../utils/transactionHelper.js');
const { AppError } = require('../utils/errorHandler.js');
const logger = require('../utils/logger.js');
const emailService = require('./email.services.js');

/**
 * Process a transfer transaction
 */
const processTransfer = async (fromAccountId, toAccountId, amount, idempotencyKey, userEmail, userName) => {
  const fromUserAccount = await accountModel.findById(fromAccountId);
  const toUserAccount = await accountModel.findById(toAccountId);

  if (!fromUserAccount || !toUserAccount) {
    throw new AppError('One or both accounts not found', 404);
  }

  const isTransactionAlreadyExists = idempotencyKey ? await transactionModel.findOne({ idempotencyKey }) : null;

  if (isTransactionAlreadyExists) {
    if (isTransactionAlreadyExists.status === 'COMPLETED') {
      return { status: 200, transaction: isTransactionAlreadyExists, message: 'Transaction already completed.' };
    } else if (isTransactionAlreadyExists.status === 'PENDING') {
      throw new AppError('This transaction is on the way.', 409);
    } else if (isTransactionAlreadyExists.status === 'FAILED') {
      throw new AppError('A transaction with the same idempotency key has failed.', 500);
    } else if (isTransactionAlreadyExists.status === 'REVERSED') {
      throw new AppError('Transaction was reversed. Please try again.', 500);
    }
  }

  const fromStatus = fromUserAccount.status;
  const toStatus = toUserAccount.status;

  if (fromStatus !== 'ACTIVE' || toStatus !== 'ACTIVE') {
    throw new AppError('Both From & To Account must be ACTIVE to process transaction', 400);
  }

  const balance = await fromUserAccount.getBalance();

  if (balance < amount) {
    throw new AppError(`Insufficient Funds. Current Balance: ${balance}, Requested: ${amount}`, 400);
  }

  // Create transaction record first (PENDING)
  const transaction = await transactionModel.create({
    fromAccount: fromAccountId,
    toAccount: toAccountId,
    amount,
    idempotencyKey,
    status: 'PENDING'
  });

  // Apply test delay for race condition testing
  await applyTestDelay();

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    await createLedgerEntries(session, fromAccountId, toAccountId, amount, transaction._id);

    transaction.status = 'COMPLETED';
    await transaction.save({ session });

    await session.commitTransaction();

    // Send email notification (fire-and-forget)
    emailService.sendTransactionEmail(userEmail, userName, amount, toAccountId)
      .catch(err => logger.error('Failed to send transaction email', err));

    return { status: 201, transaction, message: 'Transaction completed successfully.' };
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch (abortErr) {
      logger.error('Failed to abort transaction session', abortErr);
    }

    await markTransactionFailed(transaction._id);

    logger.error('Transaction failed', err);
    emailService.sendTransactionFailedEmail(userEmail, userName, amount, toAccountId)
      .catch(e => logger.error('Failed to send transaction-failed email', e));

    throw new AppError('Transaction failed: ' + err.message, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Process initial funds transaction from system user
 * @param {String} toAccountId - Target account ID
 * @param {Number} amount - Transfer amount
 * @param {String} idempotencyKey - Idempotency key
 * @param {String} systemUserId - System user's MongoDB ID (passed as req.user._id from controller)
 * @param {String} systemUserName - System user's name
 */
const processInitialFunds = async (toAccountId, amount, idempotencyKey, systemUserId, systemUserName) => {
  if (!toAccountId || !amount || !idempotencyKey) {
    throw new AppError('toAccount, amount and idempotencyKey are required', 400);
  }

  const toUserAccount = await accountModel.findById(toAccountId);
  if (!toUserAccount) {
    throw new AppError('Invalid toAccount', 400);
  }

  const fromUserAccount = await accountModel.findOne({ user: systemUserId });
  if (!fromUserAccount) {
    throw new AppError('System user account not found', 400);
  }

  if (idempotencyKey) {
    const existing = await transactionModel.findOne({ idempotencyKey });
    if (existing) {
      throw new AppError('A transaction with this idempotency key already exists', 409);
    }
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const transaction = new transactionModel({
      fromAccount: fromUserAccount._id,
      toAccount: toAccountId,
      amount,
      idempotencyKey,
      status: 'PENDING'
    });

    await transaction.save({ session });

    const debitLedger = new ledgerModel({
      account: fromUserAccount._id,
      amount,
      transaction: transaction._id,
      type: 'DEBIT'
    });
    await debitLedger.save({ session });

    const creditLedger = new ledgerModel({
      account: toAccountId,
      amount,
      transaction: transaction._id,
      type: 'CREDIT'
    });
    await creditLedger.save({ session });

    transaction.status = 'COMPLETED';
    await transaction.save({ session });

    await session.commitTransaction();

    // Notify recipient
    try {
      const userModel = require('../models/user.model.js');
      const recipient = await userModel.findById(toUserAccount.user);
      if (recipient) {
        emailService.sendTransactionEmail(recipient.email, recipient.name, amount, toAccountId)
          .catch(e => logger.error('Failed to send transaction email to recipient', e));
      }
    } catch (e) {
      logger.error('Error while sending recipient email', e);
    }

    return { status: 201, transaction, message: 'Initial funds transferred successfully.' };
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch (abortErr) {
      logger.error('Failed to abort transaction session', abortErr);
    }

    logger.error('Initial funds transaction failed', err);
    // Don't send email to system user on failure - just log the error
    throw new AppError('Initial funds transaction failed: ' + err.message, 500);
  } finally {
    session.endSession();
  }
};

module.exports = {
  processTransfer,
  processInitialFunds
};
