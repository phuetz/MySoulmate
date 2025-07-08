// Middleware pour filtrer les adresses IP
const logger = require('../utils/logger');

/**
 * Middleware qui bloque les requêtes provenant d'adresses IP spécifiées
 * via la variable d'environnement BLOCKED_IPS (séparées par des virgules)
 */
const normalizeIp = (ip) => ip.replace('::ffff:', '').replace('::1', '127.0.0.1');

module.exports = (req, res, next) => {
  const blocked = (process.env.BLOCKED_IPS || '')
    .split(',')
    .map(ip => ip.trim())
    .filter(ip => ip.length > 0);

  const rawIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
  const requestIp = normalizeIp(rawIp);

  if (blocked.includes(requestIp)) {
    logger.warn(`Requête bloquée depuis l'adresse IP interdite: ${requestIp}`);
    return res.status(403).json({ message: "Accès interdit depuis cette adresse IP" });
  }

  return next();
};
