//fucntionality of this file => creating server instance + config server

const express = require('express');
const morgan = require('morgan')
//creating server instance
const app = express();
//middleware setup
app.use(express.json())
app.use(morgan('dev'))
module.exports = app
