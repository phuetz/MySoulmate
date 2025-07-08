process.env.NODE_ENV = 'test';
process.env.BLOCKED_IPS = '127.0.0.1';

const request = require('supertest');
const app = require('../src/app');

describe('IP Filter Middleware', () => {
  it('should block requests from a forbidden IP', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('message', 'Accès interdit depuis cette adresse IP');
  });
});
