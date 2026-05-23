const app = require('./src/app.js');
const config = require('./src/config/config.js');
const connectDB = require('./src/db/db.js');
const logger = require('./src/utils/logger.js');

// Self-invoking orchestration function to run async boots smoothly
(async function startServer() {
  await connectDB();

  app.listen(config.PORT, () => {
    logger.info('Ledger server started', {
      port: config.PORT,
      environment: config.NODE_ENV
    });
  });
})();

