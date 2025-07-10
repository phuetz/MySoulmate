/**
 * Routes pour l'authentification
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateRefreshToken,
  validateVerifyEmail
} = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/securityMiddleware');

if (process.env.NODE_ENV !== 'test') {
  router.use(authLimiter);
}

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscrire un nouvel utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Données invalides ou email déjà utilisé
 */
router.post('/register', validateRegister, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connecter un utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       401:
 *         description: Email ou mot de passe incorrect
 */
router.post('/login', validateLogin, authController.login);

// Demande de réinitialisation de mot de passe
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);

// Réinitialisation du mot de passe
router.post('/reset-password', validateResetPassword, authController.resetPassword);

// Vérification de l'adresse email
router.post('/verify-email', validateVerifyEmail, authController.verifyEmail);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Rafraîchir le token d'accès
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nouveau token généré
 *       401:
 *         description: Token invalide ou expiré
 */
router.post('/refresh-token', validateRefreshToken, authController.refreshToken);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtenir les informations de l'utilisateur connecté
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données de l'utilisateur renvoyées avec succès
 *       401:
 *         description: Non authentifié
 */
router.get('/me', protect, authController.getCurrentUser);

// Gestion des sessions utilisateur
router.get('/sessions', protect, authController.getSessions);
router.post('/logout', protect, authController.logout);

module.exports = router;