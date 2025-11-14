/**
 * Health Check Endpoint Tests
 */

const request = require('supertest');
const app = require('../src/app');

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('environment');
      expect(typeof res.body.uptime).toBe('number');
    });

    it('should be publicly accessible', async () => {
      // No authentication required
      await request(app)
        .get('/health')
        .expect(200);
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health information', async () => {
      const res = await request(app)
        .get('/health/detailed')
        .expect('Content-Type', /json/);

      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('checks');

      // Check database status
      expect(res.body.checks).toHaveProperty('database');
      expect(res.body.checks.database).toHaveProperty('status');

      // Check memory status
      expect(res.body.checks).toHaveProperty('memory');
      expect(res.body.checks.memory).toHaveProperty('heapUsed');

      // Check CPU status
      expect(res.body.checks).toHaveProperty('cpu');
      expect(res.body.checks.cpu).toHaveProperty('cores');

      // Check environment variables
      expect(res.body.checks).toHaveProperty('environment');
    });

    it('should return 200 when all checks pass', async () => {
      const res = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(res.body.status).toBe('ok');
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      const res = await request(app)
        .get('/health/ready')
        .expect('Content-Type', /json/);

      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('timestamp');

      // Should be ready if database is connected
      if (res.statusCode === 200) {
        expect(res.body.status).toBe('ready');
      }
    });

    it('should be usable as Kubernetes readiness probe', async () => {
      const res = await request(app)
        .get('/health/ready');

      // Should return either 200 (ready) or 503 (not ready)
      expect([200, 503]).toContain(res.statusCode);
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const res = await request(app)
        .get('/health/live')
        .expect(200);

      expect(res.body).toHaveProperty('status', 'alive');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should always return 200 if server is running', async () => {
      // Liveness probe should succeed as long as the server can respond
      await request(app)
        .get('/health/live')
        .expect(200);
    });

    it('should be usable as Kubernetes liveness probe', async () => {
      const res = await request(app)
        .get('/health/live')
        .expect(200);

      expect(res.body.status).toBe('alive');
    });
  });
});
