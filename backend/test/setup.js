process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
process.env.EMAIL_USER = process.env.EMAIL_USER || 'test@example.com';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret';
process.env.REFRESH_TOKEN = process.env.REFRESH_TOKEN || 'test-refresh-token';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost/test';
process.env.TEST_DELAY_MS = process.env.TEST_DELAY_MS || '0';

const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../src/app');
const emailService = require('../src/services/email.services');
const userModel = require('../src/models/user.model');
const accountModel = require('../src/models/account.model');
const transactionModel = require('../src/models/transaction.model');
const ledgerModel = require('../src/models/ledger.model');

emailService.sendRegistrationEmail = async () => {};
emailService.sendLogoutAllEmail = async () => {};
emailService.sendTransactionEmail = async () => {};
emailService.sendTransactionFailedEmail = async () => {};

let mongoServer;

async function connect() {
  mongoServer = await MongoMemoryReplSet.create({
    replSet: { storageEngine: 'wiredTiger' }
  });

  await mongoose.connect(mongoServer.getUri(), {
    dbName: 'testdb'
  });
}

async function cleanup() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

async function closeDB() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

module.exports = {
  app,
  connect,
  cleanup,
  closeDB,
  userModel,
  accountModel,
  transactionModel,
  ledgerModel
};
