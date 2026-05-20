const app = require('./src/app.js');
const config = require('./src/config/config.js');
const connectDB = require('./src/db/db.js');

// Self-invoking orchestration function to run async boots smoothly
(async function startServer() {
    // 1. Force database connection confirmation BEFORE binding ports
    await connectDB();

    // 2. Bind application engine to network interface sockets
    app.listen(config.PORT, () => {
        console.log(`🚀 Ledger Server successfully deployed and running on port ${config.PORT}`);
    });
})()

