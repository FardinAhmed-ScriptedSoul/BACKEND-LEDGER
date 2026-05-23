const request = require('supertest');
const { expect } = require('chai');
const { app, connect, cleanup, closeDB } = require('./setup');

describe('Health API', () => {
  before(async () => await connect());
  after(async () => await closeDB());
  afterEach(async () => await cleanup());

  it('should return OK status', async () => {
    const res = await request(app).get('/health');

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.include({ status: 'OK', message: 'Server context is healthy' });
  });
});
