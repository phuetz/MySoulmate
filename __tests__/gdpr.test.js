/**
 * GDPR Compliance Tests
 */

const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models');

describe('GDPR Compliance', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Create test user
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'GDPR Test User',
        email: 'gdpr@example.com',
        password: 'password123'
      });

    authToken = res.body.token;
    userId = res.body.user.id;

    // Verify email
    const user = await User.findByPk(userId);
    await user.update({ emailVerified: true });
  });

  describe('GET /api/v1/gdpr/info', () => {
    it('should return data collection information', async () => {
      const res = await request(app)
        .get('/api/v1/gdpr/info')
        .expect(200);

      expect(res.body).toHaveProperty('dataCollected');
      expect(res.body).toHaveProperty('dataUsage');
      expect(res.body).toHaveProperty('dataRetention');
      expect(res.body).toHaveProperty('yourRights');
      expect(res.body).toHaveProperty('contact');

      expect(Array.isArray(res.body.dataCollected)).toBe(true);
      expect(Array.isArray(res.body.yourRights)).toBe(true);
    });

    it('should be publicly accessible', async () => {
      // No auth token required
      await request(app)
        .get('/api/v1/gdpr/info')
        .expect(200);
    });
  });

  describe('GET /api/v1/gdpr/export', () => {
    it('should export user data', async () => {
      const res = await request(app)
        .get('/api/v1/gdpr/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('format', 'JSON');
      expect(res.body).toHaveProperty('generatedAt');

      // Check data structure
      expect(res.body.data).toHaveProperty('profile');
      expect(res.body.data).toHaveProperty('exportDate');
      expect(res.body.data.profile.email).toBe('gdpr@example.com');

      // Sensitive data should not be included
      expect(res.body.data.profile.password).toBeUndefined();
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/gdpr/export')
        .expect(401);
    });
  });

  describe('POST /api/v1/gdpr/consent', () => {
    it('should update consent preferences', async () => {
      const res = await request(app)
        .post('/api/v1/gdpr/consent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          analytics: true,
          marketing: false,
          personalization: true
        })
        .expect(200);

      expect(res.body.message).toMatch(/consent preferences updated/i);
      expect(res.body.consent).toHaveProperty('analytics', true);
      expect(res.body.consent).toHaveProperty('marketing', false);
      expect(res.body.consent).toHaveProperty('personalization', true);

      // Verify in database
      const user = await User.findByPk(userId);
      const consent = JSON.parse(user.consentPreferences);
      expect(consent.analytics).toBe(true);
      expect(consent.marketing).toBe(false);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/gdpr/consent')
        .send({ analytics: true })
        .expect(401);
    });
  });

  describe('POST /api/v1/gdpr/delete', () => {
    it('should request account deletion with valid password', async () => {
      const res = await request(app)
        .post('/api/v1/gdpr/delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'password123',
          confirmation: 'DELETE'
        })
        .expect(200);

      expect(res.body.message).toMatch(/deletion requested/i);
      expect(res.body).toHaveProperty('scheduledFor');
      expect(res.body).toHaveProperty('note');

      // Verify user is marked as inactive
      const user = await User.findByPk(userId);
      expect(user.isActive).toBe(false);
    });

    it('should require correct confirmation', async () => {
      const res = await request(app)
        .post('/api/v1/gdpr/delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'password123',
          confirmation: 'WRONG'
        })
        .expect(400);

      expect(res.body.error).toBeDefined();
    });

    it('should require valid password', async () => {
      const res = await request(app)
        .post('/api/v1/gdpr/delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'wrongpassword',
          confirmation: 'DELETE'
        })
        .expect(401);

      expect(res.body.error).toMatch(/invalid password/i);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/gdpr/delete')
        .send({
          password: 'password123',
          confirmation: 'DELETE'
        })
        .expect(401);
    });
  });

  afterAll(async () => {
    // Cleanup
    await User.destroy({ where: { email: 'gdpr@example.com' } });
  });
});
