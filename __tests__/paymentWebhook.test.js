process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');

describe('Payment webhook endpoint', () => {
  it('accepts webhook events', async () => {
    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .send({ type: 'test.event' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
