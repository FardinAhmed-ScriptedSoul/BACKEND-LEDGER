const mongoose = require('mongoose');

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
const accountModel = mongoose.model("Account", accountSchema);

module.exports = accountModel;