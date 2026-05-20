const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required for creating a user"],
            trim: true,
            lowercase: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
            unique: true 
        },
        name: {
            type: String,
            required: [true, "Name is required for creating an account"],
            trim: true 
        },
        password: {
            type: String,
            required: [true, "Password is required for creating an account"],
            minlength: [6, "Password must contain at least 6 characters"],
            select: false 
        }
    },
    {
        timestamps: true // Automatically manages createdAt and updatedAt date tags
    }
);

// Pre-save middleware hook to auto-hash passwords
userSchema.pre("save", async function(next) {
    // Fixed: Changed "this.modified" to "this.isModified"
    if (!this.isModified("password")) {
        return next(); // Skip hashing if the password field wasn't changed
    }

    try {
        // Automatically calculate salt strings and generate hash state asynchronously
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        return next();
    } catch (error) {
        return next(error); // Pass any unexpected system errors forward safely
    }
});

// Instance method to check credential integrity during logins
userSchema.methods.comparePassword = async function(candidatePassword) {
    // Safety Catch: Because password has `select: false`, if you forgot to explicitly
    // select it in your login query, this.password will be undefined.
    if (!this.password) {
        throw new Error("Password field was not selected in the database query context.");
    }
    return await bcrypt.compare(candidatePassword, this.password);
};

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;