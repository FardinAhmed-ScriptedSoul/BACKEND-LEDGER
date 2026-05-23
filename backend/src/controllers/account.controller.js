const accountModel = require('../models/account.model.js');
const logger = require('../utils/logger.js');

//creating a new account for a user

async function createAccountController(req,res){
    try{
        const userId = req.user._id; 
        const account = await accountModel.create(
            {
                user: userId, 
               
            }
        );
        res.status(201).json({ status: 'success', data: account });
    }catch(error){
        logger.error('Error creating account', error);
        res.status(500).json({ status: 'failed', message: 'An error occurred while creating the account' });
    }
}


async function getUserAccountsController(req,res){
    const accounts = await accountModel.find(
        {
            user:req.user._id
        }
    )
    res.status(200)
    .json(
        {
            accounts
        }
    )
}

async function getAccountBalanceController(req,res){
    const {accountId} = req.params;

    const account = await accountModel.findOne(
        {
            _id:accountId,
            user:req.user._id
        }
    )

    if(!account){
        return res.status(404).json(
            {
                message:"Account not found"
            }
        )
    }

    const balance = await account.getBalance();

    res.status(200)
    .json(
        {
            accountId:account._id,
            balance:balance
        }
    )
}
module.exports = { createAccountController,getUserAccountsController,getAccountBalanceController };