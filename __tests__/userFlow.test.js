process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
const { sequelize, User } = require('../src/models');

/**
 * Integration test covering a basic user flow: registration, email verification,
 * login, gift purchase and inventory check.
 */

let adminToken;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await User.create({
    name: 'Admin',
    email: 'admin@example.com',
    password: 'Adminpass123!',
    role: 'admin',
    emailVerified: true
  });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@example.com', password: 'Adminpass123!' });
  adminToken = res.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('User purchase flow', () => {
  let userToken;
  let giftId;

  it('registers, verifies email and logs in the user', async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'test@flow.com', password: 'Testpass123!' });

    expect(registerRes.statusCode).toBe(201);
    const verificationToken = registerRes.body.emailVerificationToken;

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: verificationToken });
    expect(verifyRes.statusCode).toBe(200);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@flow.com', password: 'Testpass123!' });
    expect(loginRes.statusCode).toBe(200);
    userToken = loginRes.body.token;
  });

  it('allows admin to create a gift and user to purchase it', async () => {
    const giftRes = await request(app)
      .post('/api/v1/gifts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Flower', price: 5, category: 'common' });

    expect(giftRes.statusCode).toBe(201);
    giftId = giftRes.body.gift.id;

    const addRes = await request(app)
      .post('/api/v1/inventory')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ giftId, quantity: 1 });
    expect(addRes.statusCode).toBe(200);
  });

  it('returns the user inventory with the purchased gift', async () => {
    const res = await request(app)
      .get('/api/v1/inventory')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].gift.id).toBe(giftId);
  });
});
