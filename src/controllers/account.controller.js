const accountModel = require('../models/account.model.js')

//creating a new account for a user

async function createAccountController(req,res){
    try{
        const userId = req.user; 
        const account = await accountModel.create(
            {
                user: userId, // Assuming req.user is the authenticated user object
               
            }
        )
        res.status(201).json({ status: "success", data: account });
    }catch(error){
        console.error("Error creating account:", error);
        res.status(500).json({ status: "failed", message: "An error occurred while creating the account" });
    }
}

module.exports = { createAccountController };