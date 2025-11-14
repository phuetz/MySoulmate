const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { logger } = require('../config/logger');

/**
 * Service de téléchargement et optimisation d'images
 * Supporte le stockage local et S3 (AWS/MinIO)
 */

// Configuration des dossiers de stockage
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const TEMP_DIR = path.join(UPLOAD_DIR, 'temp');
const PROFILE_DIR = path.join(UPLOAD_DIR, 'profiles');
const COMPANION_DIR = path.join(UPLOAD_DIR, 'companions');
const GIFT_DIR = path.join(UPLOAD_DIR, 'gifts');

// Créer les dossiers nécessaires au démarrage
const initUploadDirs = async () => {
  const dirs = [UPLOAD_DIR, TEMP_DIR, PROFILE_DIR, COMPANION_DIR, GIFT_DIR];
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      logger.error(`Failed to create directory ${dir}:`, error);
    }
  }
};

initUploadDirs();

// Limites de fichiers
const FILE_SIZE_LIMITS = {
  profile: 5 * 1024 * 1024, // 5 MB
  companion: 10 * 1024 * 1024, // 10 MB
  gift: 5 * 1024 * 1024, // 5 MB
  default: 5 * 1024 * 1024, // 5 MB
};

// Types MIME acceptés
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

/**
 * Configuration Multer pour le stockage temporaire en mémoire
 */
const memoryStorage = multer.memoryStorage();

/**
 * Filtre pour vérifier le type de fichier
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Type de fichier non autorisé. Formats acceptés : ${ALLOWED_MIME_TYPES.join(', ')}`
      ),
      false
    );
  }
};

/**
 * Middleware Multer pour upload
 */
exports.uploadMiddleware = (fieldName = 'image', type = 'default') => {
  return multer({
    storage: memoryStorage,
    limits: {
      fileSize: FILE_SIZE_LIMITS[type] || FILE_SIZE_LIMITS.default,
    },
    fileFilter,
  }).single(fieldName);
};

/**
 * Middleware Multer pour uploads multiples
 */
exports.uploadMultipleMiddleware = (fieldName = 'images', maxCount = 10, type = 'default') => {
  return multer({
    storage: memoryStorage,
    limits: {
      fileSize: FILE_SIZE_LIMITS[type] || FILE_SIZE_LIMITS.default,
    },
    fileFilter,
  }).array(fieldName, maxCount);
};

/**
 * Génère un nom de fichier unique
 */
const generateFileName = (originalName, prefix = '') => {
  const ext = path.extname(originalName).toLowerCase();
  const randomString = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${prefix}${timestamp}-${randomString}${ext}`;
};

/**
 * Optimise et redimensionne une image
 */
const optimizeImage = async (buffer, options = {}) => {
  const {
    width = null,
    height = null,
    quality = 80,
    format = 'jpeg',
    fit = 'cover',
  } = options;

  let transformer = sharp(buffer);

  // Redimensionner si dimensions fournies
  if (width || height) {
    transformer = transformer.resize(width, height, {
      fit,
      withoutEnlargement: true,
    });
  }

  // Convertir au format demandé
  switch (format) {
    case 'jpeg':
    case 'jpg':
      transformer = transformer.jpeg({ quality, progressive: true });
      break;
    case 'png':
      transformer = transformer.png({ quality, progressive: true });
      break;
    case 'webp':
      transformer = transformer.webp({ quality });
      break;
    default:
      transformer = transformer.jpeg({ quality, progressive: true });
  }

  return transformer.toBuffer();
};

/**
 * Sauvegarde un fichier sur le disque
 */
const saveFile = async (buffer, directory, filename) => {
  const filePath = path.join(directory, filename);
  await fs.writeFile(filePath, buffer);
  return filePath;
};

/**
 * Supprime un fichier
 */
exports.deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    logger.info('File deleted:', filePath);
    return true;
  } catch (error) {
    logger.error('Failed to delete file:', { filePath, error: error.message });
    return false;
  }
};

/**
 * Télécharge et optimise une image de profil
 */
exports.uploadProfilePicture = async (file, userId) => {
  try {
    if (!file || !file.buffer) {
      throw new Error('Aucun fichier fourni');
    }

    // Générer les variantes
    const variants = {
      original: await optimizeImage(file.buffer, {
        width: 1024,
        height: 1024,
        quality: 85,
      }),
      thumbnail: await optimizeImage(file.buffer, {
        width: 150,
        height: 150,
        quality: 80,
      }),
      medium: await optimizeImage(file.buffer, {
        width: 500,
        height: 500,
        quality: 80,
      }),
    };

    // Sauvegarder les variantes
    const prefix = `profile-${userId}-`;
    const filename = generateFileName(file.originalname, prefix);
    const baseFilename = filename.replace(path.extname(filename), '');

    const savedFiles = {};
    for (const [variant, buffer] of Object.entries(variants)) {
      const variantFilename = `${baseFilename}-${variant}.jpg`;
      const filePath = await saveFile(buffer, PROFILE_DIR, variantFilename);
      savedFiles[variant] = {
        filename: variantFilename,
        path: filePath,
        url: `/uploads/profiles/${variantFilename}`,
        size: buffer.length,
      };
    }

    logger.info('Profile picture uploaded:', { userId, variants: Object.keys(savedFiles) });

    return savedFiles;
  } catch (error) {
    logger.error('Failed to upload profile picture:', error);
    throw error;
  }
};

/**
 * Télécharge et optimise une image de compagnon
 */
exports.uploadCompanionImage = async (file, companionId) => {
  try {
    if (!file || !file.buffer) {
      throw new Error('Aucun fichier fourni');
    }

    // Générer les variantes
    const variants = {
      original: await optimizeImage(file.buffer, {
        width: 2048,
        height: 2048,
        quality: 90,
      }),
      large: await optimizeImage(file.buffer, {
        width: 1024,
        height: 1024,
        quality: 85,
      }),
      medium: await optimizeImage(file.buffer, {
        width: 512,
        height: 512,
        quality: 80,
      }),
      thumbnail: await optimizeImage(file.buffer, {
        width: 150,
        height: 150,
        quality: 75,
      }),
    };

    // Sauvegarder les variantes
    const prefix = `companion-${companionId}-`;
    const filename = generateFileName(file.originalname, prefix);
    const baseFilename = filename.replace(path.extname(filename), '');

    const savedFiles = {};
    for (const [variant, buffer] of Object.entries(variants)) {
      const variantFilename = `${baseFilename}-${variant}.jpg`;
      const filePath = await saveFile(buffer, COMPANION_DIR, variantFilename);
      savedFiles[variant] = {
        filename: variantFilename,
        path: filePath,
        url: `/uploads/companions/${variantFilename}`,
        size: buffer.length,
      };
    }

    logger.info('Companion image uploaded:', { companionId, variants: Object.keys(savedFiles) });

    return savedFiles;
  } catch (error) {
    logger.error('Failed to upload companion image:', error);
    throw error;
  }
};

/**
 * Télécharge et optimise une image de cadeau
 */
exports.uploadGiftImage = async (file) => {
  try {
    if (!file || !file.buffer) {
      throw new Error('Aucun fichier fourni');
    }

    // Générer les variantes
    const variants = {
      original: await optimizeImage(file.buffer, {
        width: 1024,
        height: 1024,
        quality: 85,
      }),
      thumbnail: await optimizeImage(file.buffer, {
        width: 200,
        height: 200,
        quality: 80,
      }),
    };

    // Sauvegarder les variantes
    const prefix = 'gift-';
    const filename = generateFileName(file.originalname, prefix);
    const baseFilename = filename.replace(path.extname(filename), '');

    const savedFiles = {};
    for (const [variant, buffer] of Object.entries(variants)) {
      const variantFilename = `${baseFilename}-${variant}.jpg`;
      const filePath = await saveFile(buffer, GIFT_DIR, variantFilename);
      savedFiles[variant] = {
        filename: variantFilename,
        path: filePath,
        url: `/uploads/gifts/${variantFilename}`,
        size: buffer.length,
      };
    }

    logger.info('Gift image uploaded:', { variants: Object.keys(savedFiles) });

    return savedFiles;
  } catch (error) {
    logger.error('Failed to upload gift image:', error);
    throw error;
  }
};

/**
 * Supprime toutes les variantes d'une image
 */
exports.deleteImageVariants = async (urls) => {
  if (!Array.isArray(urls)) {
    urls = [urls];
  }

  const results = [];
  for (const url of urls) {
    // Extraire le chemin du fichier depuis l'URL
    const filename = path.basename(url);
    const directory = url.includes('profiles')
      ? PROFILE_DIR
      : url.includes('companions')
      ? COMPANION_DIR
      : GIFT_DIR;

    const filePath = path.join(directory, filename);
    const deleted = await exports.deleteFile(filePath);
    results.push({ url, deleted });
  }

  return results;
};

/**
 * Nettoie les fichiers temporaires de plus de 24 heures
 */
exports.cleanupTempFiles = async () => {
  try {
    const files = await fs.readdir(TEMP_DIR);
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      const stats = await fs.stat(filePath);
      const age = now - stats.mtimeMs;

      // Supprimer les fichiers de plus de 24 heures
      if (age > 24 * 60 * 60 * 1000) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    logger.info('Temp files cleaned up:', { deletedCount });
    return { deletedCount };
  } catch (error) {
    logger.error('Failed to cleanup temp files:', error);
    throw error;
  }
};

/**
 * Obtient la taille totale des uploads
 */
exports.getStorageStats = async () => {
  try {
    const stats = {
      profiles: { count: 0, size: 0 },
      companions: { count: 0, size: 0 },
      gifts: { count: 0, size: 0 },
      temp: { count: 0, size: 0 },
      total: { count: 0, size: 0 },
    };

    const directories = [
      { name: 'profiles', path: PROFILE_DIR },
      { name: 'companions', path: COMPANION_DIR },
      { name: 'gifts', path: GIFT_DIR },
      { name: 'temp', path: TEMP_DIR },
    ];

    for (const dir of directories) {
      const files = await fs.readdir(dir.path);
      for (const file of files) {
        const filePath = path.join(dir.path, file);
        const fileStat = await fs.stat(filePath);
        if (fileStat.isFile()) {
          stats[dir.name].count++;
          stats[dir.name].size += fileStat.size;
        }
      }
    }

    // Total
    stats.total.count = Object.values(stats)
      .filter((s) => s !== stats.total)
      .reduce((sum, s) => sum + s.count, 0);
    stats.total.size = Object.values(stats)
      .filter((s) => s !== stats.total)
      .reduce((sum, s) => sum + s.size, 0);

    // Convertir en MB
    for (const key of Object.keys(stats)) {
      stats[key].sizeMB = (stats[key].size / 1024 / 1024).toFixed(2);
    }

    return stats;
  } catch (error) {
    logger.error('Failed to get storage stats:', error);
    throw error;
  }
};

module.exports.UPLOAD_DIR = UPLOAD_DIR;
module.exports.PROFILE_DIR = PROFILE_DIR;
module.exports.COMPANION_DIR = COMPANION_DIR;
module.exports.GIFT_DIR = GIFT_DIR;
