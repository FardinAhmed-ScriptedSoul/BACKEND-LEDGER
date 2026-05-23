/*
* The Central Config Manager (src/config/config.js)
This module initializes dotenv once, reads from the environment matrix, sets sensible fallback defaults, and freezes the object to prevent accidental mutation downstream.
*/

require('dotenv').config();

const config = {
    PORT:process.env.PORT || 4000,
    MONGO_URI:process.env.MONGO_URI,
    JWT_SECRET:process.env.JWT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    REFRESH_TOKEN: process.env.REFRESH_TOKEN,
    EMAIL_USER: process.env.EMAIL_USER,
    TEST_DELAY_MS:process.env.TEST_DELAY_MS
}

//All the FAIL-FIRST check

if(!config.MONGO_URI){
    console.log("CRITICAL ERROR: MONGO_URI environmental variable is missing inside your .env file!")
    process.exit(1);
}

if(!config.JWT_SECRET){
    console.log("JWT SECRET is missing")
    process.exit(1)
}
if(!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET || !config.REFRESH_TOKEN || !config.EMAIL_USER){
    console.log("CRITICAL ERROR: One or more email configuration variables are missing in the .env file. Please ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REFRESH_TOKEN, and EMAIL_USER are all set.")
    process.exit(1);
}
module.exports = config;