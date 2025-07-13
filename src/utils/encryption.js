const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const IV = Buffer.alloc(16, 0);

function getKey() {
  const secret = process.env.PAYMENT_SECRET || 'default_payment_secret_32chars';
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(text) {
  const key = getKey();
  const cipher = crypto.createCipheriv(algorithm, key, IV);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function decrypt(text) {
  const key = getKey();
  const decipher = crypto.createDecipheriv(algorithm, key, IV);
  let decrypted = decipher.update(text, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
