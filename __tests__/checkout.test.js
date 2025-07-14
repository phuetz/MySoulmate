process.env.NODE_ENV = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ id: 'sess_123', url: 'https://checkout.stripe.com/test' })
      }
    }
  }));
});

const request = require('supertest');
const app = require('../src/app');

describe('Payment checkout endpoint', () => {
  it('creates a checkout session', async () => {
    const res = await request(app)
      .post('/api/v1/payments/checkout')
      .send({ priceId: 'price_123' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('url', 'https://checkout.stripe.com/test');
    expect(res.body).toHaveProperty('id', 'sess_123');
  });
});
