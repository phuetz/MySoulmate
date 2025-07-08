process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-key';
// Mock openai to avoid network requests
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    images: {
      createVariation: jest.fn().mockResolvedValue({
        data: { data: [{ url: 'http://example.com/avatar.png' }] }
      })
    }
  }));
});

const request = require('supertest');
const app = require('../src/app');
const path = require('path');
const fs = require('fs');

describe('Avatar Routes', () => {
  it('should return 400 when no image is provided', async () => {
    const res = await request(app).post('/api/v1/avatars/generate');
    expect(res.statusCode).toBe(400);
  });

  it('should generate an avatar from image', async () => {
    const testImage = path.join(__dirname, 'fixtures', 'test.jpg');
    fs.mkdirSync(path.join(__dirname, 'fixtures'), { recursive: true });
    fs.writeFileSync(testImage, '');

    const res = await request(app)
      .post('/api/v1/avatars/generate')
      .attach('image', testImage);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('avatarUrl', 'http://example.com/avatar.png');

    fs.unlinkSync(testImage);
  });
});
