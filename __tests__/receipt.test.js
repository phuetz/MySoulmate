process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');

describe('Receipt generation endpoint', () => {
  it('calculates totals with tax', async () => {
    const res = await request(app)
      .post('/api/v1/payments/receipt')
      .send({ items: [{ name: 'Gift', price: 10, quantity: 2 }], taxRate: 0.1 });
    expect(res.statusCode).toBe(200);
    expect(res.body.receipt).toHaveProperty('total');
    expect(res.body.receipt.total).toBeCloseTo(22);
  });

  it('returns error when no items provided', async () => {
    const res = await request(app)
      .post('/api/v1/payments/receipt')
      .send({ items: [] });
    expect(res.statusCode).toBe(400);
  });
});
