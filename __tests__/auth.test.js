/**
 * Tests pour les routes d'authentification
 */
process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
const { sequelize, User } = require('../src/models');
const bcrypt = require('bcryptjs');

// Configurer la connexion à la base de données pour les tests
beforeAll(async () => {
  // Utiliser une base de données de test
  process.env.NODE_ENV = 'test';
  
  // Synchroniser les modèles avec la base de données
  await sequelize.sync({ force: true });
});

// Nettoyer la base de données après les tests
afterAll(async () => {
  await sequelize.close();
});

let refreshToken;

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('devrait enregistrer un nouvel utilisateur', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('name', 'Test User');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('devrait renvoyer une erreur si l\'email est déjà utilisé', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Another User',
          email: 'test@example.com',
          password: 'Password456!'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Cet email est déjà utilisé');
    });

    it('devrait renvoyer une erreur si les données sont invalides', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'T',
          email: 'invalid-email',
          password: 'pass'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Créer un utilisateur pour les tests de connexion
      await User.create({
        name: 'Login Test',
        email: 'login@example.com',
        password: 'Loginpass123!',
        emailVerified: true
      });
    });

    it('devrait connecter un utilisateur avec des identifiants valides', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Loginpass123!'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', 'login@example.com');

      refreshToken = res.body.refreshToken;
    });

    it('devrait renvoyer une erreur avec un email incorrect', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'Loginpass123!'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Email ou mot de passe incorrect');
    });

    it('devrait renvoyer une erreur avec un mot de passe incorrect', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Email ou mot de passe incorrect');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeAll(async () => {
      // Obtenir un token pour les tests
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Loginpass123!'
        });
      
      token = res.body.token;
      refreshToken = res.body.refreshToken;
    });

    it('devrait renvoyer les informations de l\'utilisateur connecté', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', 'login@example.com');
    });

    it('devrait renvoyer une erreur sans token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Accès non autorisé, token manquant');
    });

    it('devrait renvoyer une erreur avec un token invalide', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Token invalide ou expiré');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('devrait rafraîchir le token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('devrait renvoyer une erreur avec un token invalide', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: 'wrong' });

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('Password reset flow', () => {
    let resetToken;

    beforeAll(async () => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('oldpassword', salt);
      await User.create({
        name: 'Reset User',
        email: 'reset@example.com',
        password: hashedPassword,
        emailVerified: true
      });
    });

    it('devrait générer un token de réinitialisation', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'reset@example.com' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      resetToken = res.body.token;
    });

    it('devrait réinitialiser le mot de passe avec un token valide', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: resetToken, password: 'Newpassword123!' });

      expect(res.statusCode).toEqual(200);
    });

    it('devrait se connecter avec le nouveau mot de passe', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'reset@example.com', password: 'Newpassword123!' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });
  });

  describe('Email verification flow', () => {
    let verificationToken;

    it('devrait enregistrer un utilisateur et renvoyer un token de vérification', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Verify', email: 'verify@example.com', password: 'Pass1234!' });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('emailVerificationToken');
      verificationToken = res.body.emailVerificationToken;
    });

    it('devrait vérifier l\'email avec un token valide', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: verificationToken });

      expect(res.statusCode).toEqual(200);
      const user = await User.findOne({ where: { email: 'verify@example.com' } });
      expect(user.emailVerified).toBe(true);
    });
  });
});
