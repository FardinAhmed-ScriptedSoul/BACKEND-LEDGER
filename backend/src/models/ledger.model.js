const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema(
    {
        account: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            required: [true, "Ledger entry must be associated with an account"],
            index: true,
            immutable: true
        },
        amount: {
            type: Number,
            required: [true, "Ledger entry must have an amount"],
            min: [0.01, "Ledger entry amount must be greater than zero"], // Prevents negative or zero entries
            immutable: true
        },
        transaction: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
            required: [true, "Ledger entry must be associated with a transaction"],
            index: true,
            immutable: true
        },
        type: {
            type: String,
            required: [true, "Ledger entry must have a type"],
            enum: {
                values: ["DEBIT", "CREDIT"],
                message: "Ledger entry type can only be DEBIT or CREDIT"
            },
            immutable: true 
        }
    },
    { 
        timestamps: true 
    }
);

ledgerSchema.index({ account: 1, type: 1, amount: 1 });
// Generic function handler for query mutations
function preventLedgerModification(next) {
    return next(new Error("CRITICAL_ERROR: Ledger entries are immutable and cannot be modified or deleted after creation."));
}

// Enforce precision rounding before saving financial entries (Prevents floating-point JavaScript math bugs)
ledgerSchema.pre("save", function () {
    if (this.isNew && this.amount) {
        // Rounds down to exactly two decimal places (e.g., 100.557 -> 100.56)
        this.amount = Math.round(this.amount * 100) / 100;
    }
});

// === 1. Instance Level Guards (For model instances using .save() or .validate()) ===
ledgerSchema.pre("save", function () {
    if (!this.isNew) {
        throw new Error("CRITICAL_ERROR: Existing ledger document objects cannot be resaved.");
    }
});

ledgerSchema.pre("validate", function () {
    if (!this.isNew) {
        throw new Error("CRITICAL_ERROR: Existing ledger document objects cannot be revalidated.");
    }
});

// === 2. Query Mutation Guards ===
ledgerSchema.pre("update", preventLedgerModification);
ledgerSchema.pre("updateOne", preventLedgerModification);
ledgerSchema.pre("updateMany", preventLedgerModification);
ledgerSchema.pre("findOneAndUpdate", preventLedgerModification);
ledgerSchema.pre("findOneAndReplace", preventLedgerModification);
ledgerSchema.pre("replaceOne", preventLedgerModification); // 💡 Added protection for replaceOne

// === 3. Query Deletion Guards ===
ledgerSchema.pre("remove", preventLedgerModification);
ledgerSchema.pre("deleteOne", preventLedgerModification);
ledgerSchema.pre("deleteMany", preventLedgerModification);
ledgerSchema.pre("findOneAndDelete", preventLedgerModification);
ledgerSchema.pre("findOneAndRemove", preventLedgerModification);

const ledgerModel = mongoose.model("Ledger", ledgerSchema);

module.exports = ledgerModel;