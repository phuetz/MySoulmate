/**
 * Two-Factor Authentication Tests
 */

const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models');
const { generate2FASecret, verify2FAToken } = require('../src/middleware/twoFactorMiddleware');

describe('Two-Factor Authentication', () => {
  let authToken;
  let userId;
  let twoFactorSecret;

  beforeAll(async () => {
    // Create test user and get auth token
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test 2FA User',
        email: 'test2fa@example.com',
        password: 'password123'
      });

    authToken = registerRes.body.token;
    userId = registerRes.body.user.id;

    // Verify email
    const user = await User.findByPk(userId);
    await user.update({ emailVerified: true });
  });

  describe('POST /api/v1/2fa/setup', () => {
    it('should generate 2FA secret and QR code', async () => {
      const res = await request(app)
        .post('/api/v1/2fa/setup')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('qrCode');
      expect(res.body).toHaveProperty('secret');
      expect(res.body).toHaveProperty('otpauthUrl');
      expect(res.body.qrCode).toMatch(/^data:image\/png;base64,/);

      // Save secret for next tests
      twoFactorSecret = res.body.secret;
    });

    it('should reject if already enabled', async () => {
      // Enable 2FA first
      const user = await User.findByPk(userId);
      await user.update({ twoFactorEnabled: true });

      const res = await request(app)
        .post('/api/v1/2fa/setup')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(res.body.error).toMatch(/already enabled/i);

      // Reset for other tests
      await user.update({ twoFactorEnabled: false });
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/2fa/setup')
        .expect(401);
    });
  });

  describe('POST /api/v1/2fa/verify', () => {
    beforeEach(async () => {
      // Setup 2FA secret
      await request(app)
        .post('/api/v1/2fa/setup')
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should enable 2FA with valid token', async () => {
      // Generate valid token
      const speakeasy = require('speakeasy');
      const token = speakeasy.totp({
        secret: twoFactorSecret,
        encoding: 'base32'
      });

      const res = await request(app)
        .post('/api/v1/2fa/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ token })
        .expect(200);

      expect(res.body.message).toMatch(/enabled successfully/i);
      expect(res.body.backupCodes).toHaveLength(10);

      // Verify user has 2FA enabled
      const user = await User.findByPk(userId);
      expect(user.twoFactorEnabled).toBe(true);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .post('/api/v1/2fa/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ token: '000000' })
        .expect(400);

      expect(res.body.error).toMatch(/invalid token/i);
    });

    it('should require token in request body', async () => {
      const res = await request(app)
        .post('/api/v1/2fa/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(res.body.error).toMatch(/token is required/i);
    });
  });

  describe('GET /api/v1/2fa/status', () => {
    it('should return 2FA status', async () => {
      const res = await request(app)
        .get('/api/v1/2fa/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('enabled');
      expect(res.body).toHaveProperty('backupCodesRemaining');
      expect(typeof res.body.enabled).toBe('boolean');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/2fa/status')
        .expect(401);
    });
  });

  describe('POST /api/v1/2fa/disable', () => {
    beforeEach(async () => {
      // Enable 2FA
      const user = await User.findByPk(userId);
      await user.update({
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(['CODE1', 'CODE2'])
      });
    });

    it('should disable 2FA with valid password', async () => {
      const res = await request(app)
        .post('/api/v1/2fa/disable')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'password123' })
        .expect(200);

      expect(res.body.message).toMatch(/disabled successfully/i);

      // Verify user has 2FA disabled
      const user = await User.findByPk(userId);
      expect(user.twoFactorEnabled).toBe(false);
      expect(user.twoFactorSecret).toBeNull();
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/2fa/disable')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'wrongpassword' })
        .expect(401);

      expect(res.body.error).toMatch(/invalid credentials/i);
    });
  });

  describe('2FA Middleware', () => {
    it('should generate valid secret', async () => {
      const result = await generate2FASecret('test@example.com');

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCode');
      expect(result).toHaveProperty('otpauthUrl');
      expect(result.secret).toHaveLength(32);
    });

    it('should verify valid token', () => {
      const speakeasy = require('speakeasy');
      const secret = speakeasy.generateSecret();
      const token = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32'
      });

      const isValid = verify2FAToken(secret.base32, token);
      expect(isValid).toBe(true);
    });

    it('should reject invalid token', () => {
      const speakeasy = require('speakeasy');
      const secret = speakeasy.generateSecret();

      const isValid = verify2FAToken(secret.base32, '000000');
      expect(isValid).toBe(false);
    });
  });

  afterAll(async () => {
    // Cleanup
    await User.destroy({ where: { email: 'test2fa@example.com' } });
  });
});
