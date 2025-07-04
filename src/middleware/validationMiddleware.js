/**
 * Middleware pour les validations de requêtes
 */
const { body } = require('express-validator');

// Validation pour l'inscription d'un utilisateur
exports.validateRegister = [
  body('name')
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  
  body('email')
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('L\'email doit être valide'),
  
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/\d/).withMessage('Le mot de passe doit contenir au moins un chiffre')
];

// Validation pour la connexion d'un utilisateur
exports.validateLogin = [
  body('email')
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('L\'email doit être valide'),
  
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis')
];

// Validation pour la mise à jour d'un utilisateur
exports.validateUpdateUser = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  
  body('email')
    .optional()
    .isEmail().withMessage('L\'email doit être valide'),
  
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/\d/).withMessage('Le mot de passe doit contenir au moins un chiffre'),
  
  body('role')
    .optional()
    .isIn(['user', 'admin']).withMessage('Le rôle doit être soit "user" soit "admin"'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen')
];

// Validation pour la création d'un produit
exports.validateProduct = [
  body('name')
    .notEmpty().withMessage('Le nom du produit est requis')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  
  body('description')
    .optional()
    .isString().withMessage('La description doit être une chaîne de caractères'),
  
  body('price')
    .notEmpty().withMessage('Le prix est requis')
    .isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Le stock doit être un entier positif'),
  
  body('imageUrl')
    .optional()
    .isURL().withMessage('L\'URL de l\'image doit être valide'),
  
  body('categoryId')
    .optional()
    .isUUID(4).withMessage('L\'ID de catégorie doit être un UUID valide'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen')
];

// Validation pour la création ou mise à jour d'une catégorie
exports.validateCategory = [
  body('name')
    .notEmpty().withMessage('Le nom de la catégorie est requis')
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  
  body('description')
    .optional()
    .isString().withMessage('La description doit être une chaîne de caractères'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen')
];