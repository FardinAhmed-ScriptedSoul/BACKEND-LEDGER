const request = require('supertest');
const jwt = require('jsonwebtoken');
const { expect } = require('chai');
const { app, connect, cleanup, closeDB, userModel, accountModel, transactionModel } = require('./setup');

async function waitFor(predicate, timeout = 2000, interval = 50) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await predicate()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error('Timeout waiting for condition');
}

describe('Transaction API', () => {
  before(async () => await connect());
  after(async () => await closeDB());
  afterEach(async () => await cleanup());

  async function registerUser(email) {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Transaction User' });

    return res.body.token;
  }

  async function createAccount(token) {
    const res = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send();

    return res.body.data;
  }

  async function createSystemUser() {
    const user = await userModel.create({
      email: `system-${Date.now()}@example.com`,
      name: 'System User',
      password: 'password123',
      systemUser: true
    });

    await accountModel.create({ user: user._id });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '3d' });
    return token;
  }

  it('should create initial funds using the system user route', async () => {
    const userToken = await registerUser('deposit@example.com');
    const userAccount = await createAccount(userToken);
    const systemToken = await createSystemUser();

    const res = await request(app)
      .post('/api/transactions/system/initial-funds')
      .set('Authorization', `Bearer ${systemToken}`)
      .send({ toAccount: userAccount._id, amount: 100, idempotencyKey: 'init-funds-1' });

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('message').that.includes('Initial funds transferred successfully');
    expect(res.body.transaction).to.have.property('amount', 100);
  });

  it('should transfer funds between two accounts', async () => {
    const userToken = await registerUser('transfer@example.com');
    const fromAccount = await createAccount(userToken);
    const toAccount = await createAccount(userToken);
    const systemToken = await createSystemUser();

    await request(app)
      .post('/api/transactions/system/initial-funds')
      .set('Authorization', `Bearer ${systemToken}`)
      .send({ toAccount: fromAccount._id, amount: 100, idempotencyKey: 'init-funds-2' });

    const transferRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 60, fromAccountId: fromAccount._id, toAccountId: toAccount._id, idempotencyKey: 'transfer-1' });

    expect(transferRes.status).to.equal(201);
    expect(transferRes.body.transaction).to.have.property('amount', 60);

    const fromBalanceRes = await request(app)
      .get(`/api/accounts/balance/${fromAccount._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    const toBalanceRes = await request(app)
      .get(`/api/accounts/balance/${toAccount._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(fromBalanceRes.body).to.have.property('balance', 40);
    expect(toBalanceRes.body).to.have.property('balance', 60);
  });

  it('should return pending status for a second concurrent transfer using the same idempotency key', async () => {
    process.env.TEST_DELAY_MS = '1000';

    const userToken = await registerUser('race@example.com');
    const fromAccount = await createAccount(userToken);
    const toAccount = await createAccount(userToken);
    const systemToken = await createSystemUser();

    await request(app)
      .post('/api/transactions/system/initial-funds')
      .set('Authorization', `Bearer ${systemToken}`)
      .send({ toAccount: fromAccount._id, amount: 100, idempotencyKey: 'init-funds-race' });

    const body = {
      amount: 50,
      fromAccountId: fromAccount._id,
      toAccountId: toAccount._id,
      idempotencyKey: 'race-key-1'
    };

    const firstRequest = new Promise((resolve, reject) => {
      request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(body)
        .end((err, res) => {
          if (err) return reject(err);
          resolve(res);
        });
    });

    await waitFor(async () => {
      const tx = await transactionModel.findOne({ idempotencyKey: 'race-key-1' });
      return tx && tx.status === 'PENDING';
    }, 2000);

    const secondResponse = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send(body);

    const firstResponse = await firstRequest;

    const statuses = [firstResponse.status, secondResponse.status];
    expect(statuses).to.include(201);
    expect(statuses).to.include(409);

    const pendingResponse = firstResponse.status === 409 ? firstResponse : secondResponse;
    const completedResponse = firstResponse.status === 201 ? firstResponse : secondResponse;

    expect(pendingResponse.body).to.have.property('error', 'This transaction is on the way.');
    expect(completedResponse.body).to.have.property('message', 'Transaction completed successfully.');

    const fromBalanceRes = await request(app)
      .get(`/api/accounts/balance/${fromAccount._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    const toBalanceRes = await request(app)
      .get(`/api/accounts/balance/${toAccount._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(fromBalanceRes.body).to.have.property('balance', 50);
    expect(toBalanceRes.body).to.have.property('balance', 50);
  });

  it('should fail when trying to transfer more than available balance', async () => {
    const userToken = await registerUser('insufficient@example.com');
    const fromAccount = await createAccount(userToken);
    const toAccount = await createAccount(userToken);
    const systemToken = await createSystemUser();

    await request(app)
      .post('/api/transactions/system/initial-funds')
      .set('Authorization', `Bearer ${systemToken}`)
      .send({ toAccount: fromAccount._id, amount: 30, idempotencyKey: 'init-funds-3' });

    const transferRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 60, fromAccountId: fromAccount._id, toAccountId: toAccount._id, idempotencyKey: 'transfer-2' });

    expect(transferRes.status).to.equal(400);
    expect(transferRes.body).to.have.property('error').that.includes('Insufficient Funds');
  });
});
