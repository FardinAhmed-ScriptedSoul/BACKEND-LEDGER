const userModel = require('../models/user.model.js');
const config = require('../config/config.js');
const tokenManager = require('../utils/tokenManager.js');
const logger = require('../utils/logger.js');
const emailServices = require('../services/email.services.js');
const tokenBlackListModel = require('../models/blackList.model.js');
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

        const token = tokenManager.generateToken(user._id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: config.COOKIE_SECURE,
            sameSite: 'strict',
            maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days in milliseconds
        });

        
        // By omitting 'await', it runs in the background asynchronously without delaying the API response!
        emailServices.sendRegistrationEmail(user.email, user.name)
            .then(() => {
                logger.info(`Welcome email sent`, { email: user.email });
            })
            .catch((emailError) => {
                logger.error(`Failed to send welcome email`, emailError);
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
        logger.error('Registration controller error', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error encountered during registration'
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
        const token = tokenManager.generateToken(user._id);
        res.cookie('token', token, {
            httpOnly: true,
            secure: config.COOKIE_SECURE,
            sameSite: 'strict',
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
    } catch (error) {
        logger.error('Login controller error', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error encountered during login'
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
        res.clearCookie('token', {
            httpOnly: true,
            secure: config.COOKIE_SECURE,
            sameSite: 'strict'
        });

        return res.status(200).json({
            status: 'success',
            message: 'Logged out successfully from this device.'
        });
    } catch (error) {
        logger.error('Logout controller error', error);
        return res.status(500).json({ status: 'error', message: 'Error during logout process' });
    }
}

/**
 * user logout and token is blacklisted
 * @param {*} req
 * @param {*} res
 * @route POST /api/auth/logout/blacklist
 */

async function userLogoutBlacklistToken(req, res) {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(400).json({ message: "User does not have a token; you are already logged out." });
        }

        res.clearCookie('token', {
            httpOnly: true,
            secure: config.COOKIE_SECURE,
            sameSite: 'strict'
        });

        await tokenBlackListModel.create({ token });

        return res.status(200).json({ status: 'success', message: 'User logged out successfully and token blacklisted.' });
    } catch (error) {
        logger.error('Logout blacklist controller error', error);
        return res.status(500).json({ status: 'error', message: 'Failed to blacklist token during logout.' });
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
        res.clearCookie('token', {
            httpOnly: true,
            secure: config.COOKIE_SECURE,
            sameSite: 'strict'
        });

        // 3. Fire security notice email out background channel asynchronously
        emailServices.sendLogoutAllEmail(req.user.email, req.user.name)
            .then(() => logger.info('Device eviction notification sent', { email: req.user.email }))
            .catch((err) => logger.error('Logout notification email failure', err));

        return res.status(200).json({
            status: "success",
            message: "Logged out from all active devices successfully. Notice email dispatched."
        });
    } catch (error) {
        logger.error('Logout all controller error', error);
        return res.status(500).json({ status: 'error', message: 'Error during comprehensive session reset' });
    }
}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController,
    userLogoutAllController,
    userLogoutBlacklistToken
};

