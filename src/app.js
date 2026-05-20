const express = require('express');
const morgan = require('morgan');
const authRouter = require('./routes/auth.routes.js')
const cookieParser = require('cookie-parser')
const app = express();

// Global Request Middlewares
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());

// Target Base Routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server context is healthy' });
});
// AUTH routes
app.use("/api/auth",authRouter)
module.exports = app;