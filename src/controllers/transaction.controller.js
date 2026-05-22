/**
 * -Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
 * 1. Validate request body (amount, fromAccountId, toAccountId)
 * 2. Validate if users exist and fetch accounts
 * 3. Validate idempotency key (if provided) to prevent duplicate transactions
 * 4. Check account status
 * 5. Suffincient balance Check=> Derive sender balance from ledger
 * 6. Create Transanction(pending)
 * 7. Update ledger entries
 * 8. send email notification
 * -Get transaction details by ID
 * 1. Validate transaction ID parameter
 * 2. Fetch Transaction document by ID and populate related account and ledger details
 * 3. If not found, return 404 error
 * 4. Return transaction details in response
 * -Get all transactions for a specific account
 * 1. Validate account ID parameter
 * 2. Fetch all Transaction documents where fromAccount or toAccount matches the given account ID
 * 3. If no transactions found, return empty array
 * 4. Return list of transactions in response
 * 
 
 */

const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const accountModel = require('../models/account.model');
const mongoose = require('mongoose');
const emailService = require('../services/email.services');

async function createTransaction(req, res){
    const { amount, fromAccountId, toAccountId, idempotencyKey } = req.body;

    // Step 1: Validate request body

    if(!amount || !fromAccountId || !toAccountId){
        return res.status(400).json({ error: "Amount, fromAccountId, and toAccountId are required." });
    }

    // Step 2: Validate if users exist and fetch accounts
    const fromUserAccount = await accountModel.findById(fromAccountId);
    const toUserAccount = await accountModel.findById(toAccountId);

    if(!fromUserAccount || !toUserAccount){
        return res.status(404).json({ error: "One or both accounts not found." });
    }

    // 3. Validate idempotency key (if provided) to prevent duplicate transactions
    const isTransactionAlreadyExists = idempotencyKey ? await transactionModel.findOne({ idempotencyKey }) : null;

    if(isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status === "COMPLETED"){
            return res.status(200).json({ message: "Transaction already completed.", transaction: isTransactionAlreadyExists });
        } else if(isTransactionAlreadyExists.status === "PENDING"){
            return res.status(409).json({ error: "A transaction with the same idempotency key is already in progress." });
        } else if(isTransactionAlreadyExists.status === "FAILED"){
            return res.status(500).json({ error: "A transaction with the same idempotency key has failed." });
        } else if(isTransactionAlreadyExists.status === "REVERSED"){
            return res.status(500).json({error:"Transaction was reveresed please try AGAIN!!"})
        }
    }

    // 4. Check Account status

    const fromStatus = fromUserAccount.status;
    const toStatus = toUserAccount.status;

    if(fromStatus!=='ACTIVE' || toStatus!=='ACTIVE'){
        return res.status(400).json(
            {
                message:"Both From & To Account must be ACTIVE to process transation"
            }
        )
    }

   //5. Suffincient balance Check=> Derive sender balance from ledger
   const balance = await fromUserAccount.getBalance()

   if(balance<amount){
        return res.status(400).json(
            {
                message:`Insufficient Funds current Balance:${balance} and requested transfer amount is ${amount}`
            }
        )
   }

   // 6. Create Transanction(pending)

   const session = await mongoose.startSession();
   try {
       session.startTransaction();

       const [transaction] = await transactionModel.create([
           {
               fromAccount: fromAccountId,
               toAccount: toAccountId,
               amount,
               idempotencyKey,
               status: "PENDING"
           }
       ], { session });

       await ledgerModel.create([
           {
               account: fromAccountId,
               amount,
               transaction: transaction._id,
               type: "DEBIT"
           }
       ], { session });

       await ledgerModel.create([
           {
               account: toAccountId,
               amount,
               transaction: transaction._id,
               type: "CREDIT"
           }
       ], { session });

       transaction.status = "COMPLETED";
       await transaction.save({ session });

       await session.commitTransaction();

       // 8. send email notification (fire-and-forget)
       emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccountId)
           .catch(err => console.error('Failed to send transaction email:', err));

       return res.status(201).json({ message: "Transaction completed successfully.", transaction });
   } catch (err) {
       try {
           await session.abortTransaction();
       } catch (abortErr) {
           console.error('Failed to abort transaction session:', abortErr);
       }

       console.error('Transaction failed:', err);
       // Notify user about failed transaction (best-effort)
       try {
           emailService.sendTransactionFailedEmail(req.user.email, req.user.name, amount, toAccountId)
               .catch(e => console.error('Failed to send transaction-failed email:', e));
       } catch (emailErr) {
           console.error('Error invoking failed-email sender:', emailErr);
       }
       return res.status(500).json({ error: 'Transaction failed.', details: err.message });
   } finally {
       session.endSession();
   }


}

module.exports = {
    createTransaction,
}