const crypto = require('crypto');

const algorithm = 'aes-256-cbc';

/**
 * Get encryption key from environment variable
 * @throws {Error} If PAYMENT_SECRET is not set
 * @returns {Buffer} 32-byte encryption key
 */
function getKey() {
  const secret = process.env.PAYMENT_SECRET;
  if (!secret) {
    throw new Error('PAYMENT_SECRET environment variable is required for encryption');
  }
  if (secret.length < 32) {
    throw new Error('PAYMENT_SECRET must be at least 32 characters long');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt text using AES-256-CBC with random IV
 * @param {string} text - Text to encrypt
 * @returns {string} Base64 encoded string containing IV and encrypted data (iv:encryptedData)
 */
function encrypt(text) {
  const key = getKey();
  // Generate random IV for each encryption (CRITICAL for security)
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  // Return IV + encrypted data (IV is not secret, just needs to be unique)
  return iv.toString('base64') + ':' + encrypted;
}

/**
 * Decrypt text encrypted with encrypt() function
 * @param {string} text - Encrypted text (format: iv:encryptedData)
 * @returns {string} Decrypted text
 */
function decrypt(text) {
  const key = getKey();
  // Split IV and encrypted data
  const parts = text.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted data format');
  }
  const iv = Buffer.from(parts[0], 'base64');
  const encryptedData = parts[1];

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
