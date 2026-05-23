const mongoose = require('mongoose');
const ledgerModel = require('./ledger.model.js')
const accountSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        status: {
            type: String,
            enum: {
                values: ["ACTIVE", "FROZEN", "CLOSED"],
                message: "Status can only be ACTIVE, FROZEN, or CLOSED"
            },
            default: "ACTIVE"
        },
        currency: {
            type: String,
            required: [true, "Currency is required for creating an account"],
            default: "USD"
        }
    }, {
    timestamps: true
}

)
/**
 * creating a compound index on user and status fields to optimize queries that filter accounts by user and status. This is especially beneficial for operations like fetching all active accounts for a specific user, which is a common use case in financial applications. By indexing these fields together, MongoDB can quickly locate relevant documents without having to scan the entire collection, thus improving query performance and efficiency.
 */
accountSchema.index(
    {
        user: 1,
        status: 1
    }
)

//finding balance using ledger's && AGGREGRATION pipeline
accountSchema.methods.getBalance = async function() {
    const balanceData = await ledgerModel.aggregate([ 
        { 
            $match: { account: this._id } 
        },
        {
            $group: { 
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "DEBIT"] },
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "CREDIT"] },
                            "$amount",
                            0
                        ]
                    }
                }
            }
        },
        {
            $project: { // 💡 Added missing colon after $project
                _id: 0,
                balance: { $subtract: ["$totalCredit", "$totalDebit"] }
            }
        }
    ]);

    // If a brand new account has no ledger entries yet, the array will be empty
    if (balanceData.length === 0) {
        return 0;
    }

    return balanceData[0].balance;
};

const accountModel = mongoose.model("Account", accountSchema);



module.exports = accountModel;