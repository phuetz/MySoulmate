/**
 * Password validation utility
 * Enforces strong password requirements
 */

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
exports.validatePasswordStrength = (password) => {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Le mot de passe est requis'] };
  }

  // Minimum length
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }

  // Maximum length
  if (password.length > 128) {
    errors.push('Le mot de passe ne doit pas dépasser 128 caractères');
  }

  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre majuscule');
  }

  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre minuscule');
  }

  // At least one number
  if (!/\d/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  // At least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }

  // Check for common patterns
  const commonPatterns = [
    /^(password|123456|qwerty|abc123)/i,
    /(.)\1{3,}/, // Same character repeated 4+ times
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Le mot de passe est trop commun ou contient des motifs répétitifs');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Check if password has been compromised (basic check against common passwords)
 * @param {string} password - Password to check
 * @returns {boolean} - true if password is compromised
 */
exports.isPasswordCompromised = (password) => {
  const commonPasswords = [
    'password', 'Password1!', '12345678', 'qwerty123', 'Abc12345!',
    'welcome1', 'Welcome1!', 'password1', 'Password1', 'admin123',
    'Admin123!', 'letmein1', 'Letmein1!', 'monkey12', 'Monkey12!'
  ];

  return commonPasswords.some(common =>
    password.toLowerCase() === common.toLowerCase()
  );
};

/**
 * Calculate password strength score
 * @param {string} password - Password to score
 * @returns {Object} - { score: number, strength: string }
 */
exports.calculatePasswordStrength = (password) => {
  let score = 0;

  if (!password) {
    return { score: 0, strength: 'Très faible' };
  }

  // Length score
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

  // Bonus for good practices
  if (password.length >= 20) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?].*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

  let strength;
  if (score <= 3) {
    strength = 'Très faible';
  } else if (score <= 5) {
    strength = 'Faible';
  } else if (score <= 7) {
    strength = 'Moyen';
  } else if (score <= 9) {
    strength = 'Fort';
  } else {
    strength = 'Très fort';
  }

  return { score, strength };
};
