process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Gift, UserGift } = require('../src/models');

let userToken;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await User.create({
    name: 'User',
    email: 'user@example.com',
    password: 'Userpass123!',
    emailVerified: true
  });
  await Gift.create({ name: 'Gift', price: 10, category: 'common' });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'user@example.com', password: 'Userpass123!' });
  userToken = res.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Inventory Routes', () => {
  let giftId;
  beforeAll(async () => {
    const gift = await Gift.findOne();
    giftId = gift.id;
  });

  it('should add a gift to inventory', async () => {
    const res = await request(app)
      .post('/api/v1/inventory')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ giftId, quantity: 2 });
    expect(res.statusCode).toBe(200);
    expect(res.body.item.quantity).toBe(2);
  });

  it('should get inventory with the added gift', async () => {
    const res = await request(app)
      .get('/api/v1/inventory')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].gift.id).toBe(giftId);
    expect(res.body.items[0].quantity).toBe(2);
  });
});
