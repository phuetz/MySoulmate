process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Gift } = require('../src/models');

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

describe('Gift Routes', () => {
  let giftId;

  it('should create a new gift', async () => {
    const res = await request(app)
      .post('/api/v1/gifts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Gift', price: 10, category: 'common' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('gift');
    giftId = res.body.gift.id;
  });

  it('should get gift by id', async () => {
    const res = await request(app).get(`/api/v1/gifts/${giftId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', giftId);
  });

  it('should update a gift', async () => {
    const res = await request(app)
      .put(`/api/v1/gifts/${giftId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 20 });
    expect(res.statusCode).toBe(200);
    expect(res.body.gift.price).toBe(20);
  });

  it('should delete a gift', async () => {
    const res = await request(app)
      .delete(`/api/v1/gifts/${giftId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});

