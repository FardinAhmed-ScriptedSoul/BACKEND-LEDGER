const userModel = require('../models/user.model.js');
const config = require('../config/config.js');
const jwt = require('jsonwebtoken');
const emailServices = require('../services/email.services.js');

/**
 * User register controller
 * @param {*} req 
 * @param {*} res 
 * @route POST /api/auth/register
 */

async function userRegisterController(req, res) {
    try {
        const { email, password, name } = req.body;

        // [VALIDATION STEP] Guard against empty payloads
        if (!email || !password || !name) {
            return res.status(400).json({
                status: "failed",
                message: "Email, password, and name are required."
            });
        }

        // Checking for user with same email
        const isExists = await userModel.findOne({ email });
        
        if (isExists) {
            return res.status(409).json({
                status: "failed",
                message: "User already exists with the same email"
            });
        }

        // Creating a new user
        const user = await userModel.create({
            email,
            password,
            name
        });

        // Generate the JWT access token 
        const token = jwt.sign(
            { userId: user._id },
            config.JWT_SECRET,
            { expiresIn: "3d" }
        );

        // Set secure cookie with the token
        res.cookie("token", token, {
            httpOnly: true,
            secure: true, 
            sameSite: "strict",
            maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days in milliseconds
        });

        
        // By omitting 'await', it runs in the background asynchronously without delaying the API response!
        emailServices.sendRegistrationEmail(user.email, user.name)
            .then(() => {
                console.log(`📧 Welcome email sent successfully to ${user.email}`);
            })
            .catch((emailError) => {
                console.error(`❌ Failed to send welcome email to ${user.email}:`, emailError);
            });

        // Final HTTP Response exit point
        return res.status(201).json({
            status: "success",
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        });
        
    } catch (error) {
        console.error("❌ Registration Controller Error:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error encountered during registration"
        });
    }
}

/**
 * User login controller
 * @param {*} req 
 * @param {*} res
 * @route POST /api/auth/login
 */

async function userLoginController(req,res){
    try{
        // 1. Extract credentials from request body
        const { email, password } = req.body;
        // 2. Validate presence of credentials
        if (!email || !password) {
            return res.status(400).json({
                status: "failed",
                message: "Email and password are required for login."
            });
        }
        // 3. Find user by email and explicitly select password field
        const user = await userModel.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({
                status: "failed",
                message: "Invalid credentials"
            });
        }
        // 4. Compare provided password with stored hash
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                status: "failed",
                message: "Invalid credentials"
            });
        }
        // 5. Generate JWT token upon successful authentication
        const token = jwt.sign(
            { userId: user._id },
            config.JWT_SECRET,
            { expiresIn: "3d" }
        );
        // 6. Set secure cookie with the token
        res.cookie("token", token, {
            httpOnly: true,
            secure: true, 
            sameSite: "strict",
            maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days in milliseconds
        });
        // 7. Respond with user info and token
        return res.status(200).json({
            status: "success",
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        });
    }catch(error){
        console.error("❌ Login Controller Error:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error encountered during login"
        });
    }
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function userLogoutController(req, res) {
    try {
        // Just clear the HTTP cookie cache context from the requesting device
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "strict"
        });

        return res.status(200).json({
            status: "success",
            message: "Logged out successfully from this device."
        });
    } catch (error) {
        console.error("❌ Logout Controller Error:", error);
        return res.status(500).json({ status: "error", message: "Error during logout process" });
    }
}

/**
 * User logout from all devices controller
 * @param {*} req 
 * @param {*} res
 * @route POST /api/auth/logout-all
 */
async function userLogoutAllController(req, res) {
    try {
        // 1. Increment tokenVersion in DB to instantly invalidate ALL existing tokens everywhere
        req.user.tokenVersion += 1;
        await req.user.save();

        // 2. Wipe cookie on this device
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "strict"
        });

        // 3. Fire security notice email out background channel asynchronously
        emailServices.sendLogoutAllEmail(req.user.email, req.user.name)
            .then(() => console.log(`📧 Device eviction notification sent to ${req.user.email}`))
            .catch((err) => console.error(`❌ Logout notification email failure:`, err));

        return res.status(200).json({
            status: "success",
            message: "Logged out from all active devices successfully. Notice email dispatched."
        });
    } catch (error) {
        console.error("❌ Logout All Controller Error:", error);
        return res.status(500).json({ status: "error", message: "Error during comprehensive session reset" });
    }
}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController,
    userLogoutAllController
};

