const request = require('supertest');
const { expect } = require('chai');
const { app, connect, cleanup, closeDB } = require('./setup');

describe('Auth API', () => {
  before(async () => await connect());
  after(async () => await closeDB());
  afterEach(async () => await cleanup());

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user1@example.com', password: 'password123', name: 'User One' });

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('status', 'success');
    expect(res.body).to.have.property('token').that.is.a('string');
  });

  it('should login an existing user', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@example.com', password: 'password123', name: 'Login User' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('status', 'success');
    expect(res.body).to.have.property('token').that.is.a('string');
  });

  it('should logout using protected cookie route', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'logout@example.com', password: 'password123', name: 'Logout User' });

    const cookie = registerRes.headers['set-cookie'];
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('status', 'success');
  });

  it('should logout from all sessions using protected route', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'logout-all@example.com', password: 'password123', name: 'LogoutAll User' });

    const cookie = registerRes.headers['set-cookie'];
    const res = await request(app)
      .post('/api/auth/logout-all')
      .set('Cookie', cookie);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('status', 'success');
  });

  it('should blacklist the token on logout/blacklist and reject it for protected routes', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'blacklist@example.com', password: 'password123', name: 'Blacklist User' });

    const token = registerRes.body.token;

    const blacklistRes = await request(app)
      .post('/api/auth/logout/blacklist')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(blacklistRes.status).to.equal(200);
    expect(blacklistRes.body).to.have.property('status', 'success');
    expect(blacklistRes.body).to.have.property('message').that.includes('blacklisted');

    const protectedRes = await request(app)
      .get('/api/accounts')
      .set('Authorization', `Bearer ${token}`);

    expect(protectedRes.status).to.equal(401);
    expect(protectedRes.body).to.have.property('message').that.includes('invalid');
  });
});
