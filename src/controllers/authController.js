/**
 * Contrôleur pour l'authentification des utilisateurs
 */
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User, Sequelize } = require('../models');
const logger = require('../utils/logger');
const crypto = require('crypto');
const { Op } = Sequelize;

/**
 * @desc    Inscription d'un nouvel utilisateur
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Créer un nouvel utilisateur
    const user = await User.create({
      name,
      email,
      password
    });

    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'votre_secret_jwt',
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );

    res.status(201).json({
      message: 'Utilisateur enregistré avec succès',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Erreur lors de l\'inscription:', error);
    next(error);
  }
};

/**
 * @desc    Connexion d'un utilisateur
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Rechercher l'utilisateur par email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(401).json({ message: 'Ce compte a été désactivé' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.isPasswordValid(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Mettre à jour la date de dernière connexion
    await user.update({ lastLogin: new Date() });

    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'votre_secret_jwt',
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );

    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la connexion:', error);
    next(error);
  }
};

/**
 * @desc    Vérifier le token JWT et renvoyer les informations de l'utilisateur
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    // L'utilisateur est déjà chargé par le middleware d'authentification
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du profil:', error);
    next(error);
  }
};

/**
 * @desc    Demander une réinitialisation de mot de passe
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (user) {
      const token = crypto.randomBytes(20).toString('hex');
      await user.update({
        passwordResetToken: token,
        passwordResetExpires: Date.now() + 3600000 // 1h
      });
      // Dans une vraie appli, on enverrait un email ici
      return res.status(200).json({ message: 'Email de réinitialisation envoyé', token });
    }

    // Pour la sécurité, ne pas révéler que l'email n'existe pas
    res.status(200).json({ message: 'Email de réinitialisation envoyé' });
  } catch (error) {
    logger.error("Erreur lors de la demande de reset:", error);
    next(error);
  }
};

/**
 * @desc    Réinitialiser le mot de passe avec un token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    const user = await User.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    logger.error("Erreur lors de la réinitialisation du mot de passe:", error);
    next(error);
  }
};