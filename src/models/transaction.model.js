const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        fromAccount:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            required: [true, "Transaction must have a source account"],
            index: true
        },
        toAccount:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            required: [true, "Transaction must have a destination account"],
            index: true
        },
        status:{
            type: String,
            enum:{
                values: ["PENDING", "COMPLETED", "FAILED","REVERSED"],
                message: "Status can only be PENDING, COMPLETED, FAILED, or REVERSED"
            },
            default: "PENDING"
        },
        amount:{
            type: Number,
            required: [true, "Transaction amount is required"],
            min: [0, "Transaction amount must be at least 0.01"]
        },
        idempotencyKey:{
            type: String,
            required: [true, "Idempotency key is required for transaction"],
            unique: true,
            index: true
        }
    }, {
    timestamps: true
    }
)

const transactionModel = mongoose.model("Transaction", transactionSchema);

module.exports = transactionModel;