process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Category } = require('../src/models');

let adminToken;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await User.create({
    name: 'Admin',
    email: 'admin@example.com',
    password: 'Adminpass123!',
    role: 'admin',
    emailVerified: true
  });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@example.com', password: 'Adminpass123!' });
  adminToken = res.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Category Routes', () => {
  let categoryId;

  it('should create a new category', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Category', description: 'A category for testing' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('category');
    categoryId = res.body.category.id;
  });

  it('should get all categories', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.statusCode).toBe(200);
    expect(res.body.categories.length).toBeGreaterThan(0);
  });

  it('should get category by id', async () => {
    const res = await request(app).get(`/api/v1/categories/${categoryId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', categoryId);
  });

  it('should update a category', async () => {
    const res = await request(app)
      .put(`/api/v1/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Category', description: 'Updated description' });
    expect(res.statusCode).toBe(200);
    expect(res.body.category.description).toBe('Updated description');
  });

  it('should delete a category', async () => {
    const res = await request(app)
      .delete(`/api/v1/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});
