const express = require('express');
const morgan = require('morgan');

const app = express();

// Global Request Middlewares
app.use(express.json());
app.use(morgan('dev'));

// Target Base Routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server context is healthy' });
});

module.exports = app;