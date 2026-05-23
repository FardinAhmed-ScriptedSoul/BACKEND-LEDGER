const request = require('supertest');
const { expect } = require('chai');
const { app, connect, cleanup, closeDB } = require('./setup');

describe('Account API', () => {
  before(async () => await connect());
  after(async () => await closeDB());
  afterEach(async () => await cleanup());

  let token;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'account@example.com', password: 'password123', name: 'Account User' });

    token = res.body.token;
  });

  it('should create a new account for the authenticated user', async () => {
    const res = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('status', 'success');
    expect(res.body.data).to.include.keys('_id', 'user');
  });

  it('should return accounts for the authenticated user', async () => {
    await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send();

    const res = await request(app)
      .get('/api/accounts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.accounts).to.be.an('array').with.lengthOf(1);
  });

  it('should return the balance for an account', async () => {
    const createRes = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send();

    const accountId = createRes.body.data._id;
    const balanceRes = await request(app)
      .get(`/api/accounts/balance/${accountId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(balanceRes.status).to.equal(200);
    expect(balanceRes.body).to.have.property('balance', 0);
    expect(balanceRes.body).to.have.property('accountId', accountId);
  });
});
