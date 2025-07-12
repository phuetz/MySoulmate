process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');

describe('Companion Routes', () => {
  it('should return companion data', async () => {
    const res = await request(app).get('/api/v1/companion');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('companion');
    expect(res.body.companion).toHaveProperty('name');
  });
});
