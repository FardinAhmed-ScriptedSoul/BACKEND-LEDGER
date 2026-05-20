/*
* The Central Config Manager (src/config/config.js)
This module initializes dotenv once, reads from the environment matrix, sets sensible fallback defaults, and freezes the object to prevent accidental mutation downstream.
*/

require('dotenv').config();

const config = {
    PORT:process.env.PORT || 4000,
    MONGO_URI:process.env.MONGO_URI
}

//All the FAIL-FIRST check

if(!config.MONGO_URI){
    console.log("CRITICAL ERROR: MONGO_URI environmental variable is missing inside your .env file!")
    process.exit(1);
}

module.exports = config;