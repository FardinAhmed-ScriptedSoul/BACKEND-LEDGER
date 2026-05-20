const mongoose = require('mongoose')
const config = require('../config/config.js')

async function connectDB(){
    try{
        //create a connection instance
        const connectionInstance = await mongoose.connect(config.MONGO_URI);
        console.log(`✅ MongoDB Connection Established! Host Target: ${connectionInstance.connection.host}`);

    } catch (error) {
        console.error(`❌ MongoDB Connection Failure: ${error.message}`);
        process.exit(1); // Gracefully kill the system process if database is unavailable
    }
}

// Monitor active state connection health events across application lifecycles
/**
 * Connection Lifecycle Event Observers: mongoose.connection.on() maps real-time status infrastructure checks. If your cluster falls over or suffers a regional network drop mid-day, your application terminal logs it instantly.
 */
mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB connection context lost. Re-establishing connection...');
});

mongoose.connection.on('error', (err) => {
    console.error(`❌ Active MongoDB network channel error encountered: ${err}`);
});

module.exports = connectDB;