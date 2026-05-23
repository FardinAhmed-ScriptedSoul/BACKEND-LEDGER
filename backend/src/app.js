const express = require('express');
const morgan = require('morgan');

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

/**
 * requiring routes
 */
const authRouter = require('./routes/auth.routes.js');
const accountRouter = require('./routes/account.routes.js');
const transactionRouter = require('./routes/transaction.routes.js');

// AUTH routes
app.use('/api/auth', authRouter);
// ACCOUNT routes
app.use('/api/accounts', accountRouter);
// TRANSACTION routes
app.use('/api/transactions', transactionRouter);

module.exports = app;