const jwt = require('jsonwebtoken');
const config = require('../config/config.js');
const userModel = require('../models/user.model.js');

async function protect(req, res, next) {
    try {
        let token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ status: "failed", message: "Not authorized, token missing" });
        }

        // 1. Decode the token payload
        const decoded = jwt.verify(token, config.JWT_SECRET);

        // 2. Fetch the user from the database
        const user = await userModel.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ status: "failed", message: "User no longer exists" });
        }

        // 3. Fallback normalization: If tokenVersion doesn't exist yet on this user document, treat it as 0
        const currentDbVersion = user.tokenVersion !== undefined ? user.tokenVersion : 0;
        const currentTokenVersion = decoded.tokenVersion !== undefined ? decoded.tokenVersion : 0;

        // 🔴 Debug Logs: This will tell us EXACTLY what values Node is comparing!
        console.log(`🔍 DB Version: ${currentDbVersion} | Token Version: ${currentTokenVersion}`);

        if (currentDbVersion !== currentTokenVersion) {
            return res.status(401).json({
                status: "failed",
                message: "Session expired or invalidated. Please login again."
            });
        }

        // Attach user to request context
        req.user = user;
        next();
    } catch (error) {
        console.error("❌ Auth Middleware Error:", error);
        return res.status(401).json({ status: "failed", message: "Not authorized, invalid token" });
    }
}

async function authMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json(
            {
                status: "failed", message: "Not authorized, token missing"
            }
        );
    }

    try{
        const decoded = jwt.verify(token,config.JWT_SECRET);
        const user = await userModel.findById(decoded.userId);
        if(!user){
            return res.status(401).json({ status: "failed", message: "User no longer exists" });
        }
        
        // Fallback normalization for tokenVersion
        const currentDbVersion = user.tokenVersion !== undefined ? user.tokenVersion : 0;
        const currentTokenVersion = decoded.tokenVersion !== undefined ? decoded.tokenVersion : 0;

        req.user = user;
        next();

    }catch(error){
        console.error("❌ Auth Middleware Error:", error);
        return res.status(401).json({ status: "failed", message: "Not authorized, invalid token" });
    }
}

async function authSystemUserMiddleware(req,res,next){
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized access, token missing" });
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await userModel.findById(decoded.userId).select('+systemUser');
        if (!user || !user.systemUser) {
            return res.status(403).json({ message: 'Forbidden: This route is only for system users' });
        }

        req.user = user;
        return next();
    } catch (error) {
        console.error('❌ authSystemUserMiddleware error:', error);
        return res.status(401).json({ message: 'Unauthorized access: token missing or invalid' });
    }

}

module.exports = { protect, authMiddleware, authSystemUserMiddleware  };