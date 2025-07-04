/**
 * Configuration du logger pour l'application
 */
const winston = require('winston');
const path = require('path');

// Définir les niveaux de logs et les couleurs
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Définir différentes couleurs pour chaque niveau de log
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Ajouter les couleurs à winston
winston.addColors(colors);

// Définir le format des logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

// Définir les transports pour les logs
const transports = [
  // Afficher tous les logs dans la console
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} [${info.level}]: ${info.message}`
      )
    ),
  }),
  
  // Écrire les logs d'erreur dans un fichier
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    dirname: 'logs',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Écrire tous les logs dans un fichier
  new winston.transports.File({
    filename: 'logs/combined.log',
    dirname: 'logs',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Créer le répertoire de logs s'il n'existe pas
const fs = require('fs');
const dir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

// Créer et configurer le logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format,
  transports,
});

module.exports = logger;