/**
 * Utilitaire pour standardiser les réponses API
 */

/**
 * Envoyer une réponse de succès
 * @param {object} res - L'objet de réponse Express
 * @param {string} message - Message de succès
 * @param {object} data - Données à envoyer
 * @param {number} statusCode - Code de statut HTTP (défaut: 200)
 */
exports.success = (res, message = 'Opération réussie', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Envoyer une réponse d'erreur
 * @param {object} res - L'objet de réponse Express
 * @param {string} message - Message d'erreur
 * @param {number} statusCode - Code de statut HTTP (défaut: 400)
 * @param {object} errors - Détails des erreurs
 */
exports.error = (res, message = 'Une erreur est survenue', statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Envoyer une réponse paginée
 * @param {object} res - L'objet de réponse Express
 * @param {string} message - Message de succès
 * @param {object} data - Données à envoyer
 * @param {number} page - Numéro de page actuel
 * @param {number} limit - Limite d'éléments par page
 * @param {number} total - Nombre total d'éléments
 * @param {number} statusCode - Code de statut HTTP (défaut: 200)
 */
exports.paginate = (
  res,
  message = 'Données récupérées avec succès',
  data = [],
  page = 1,
  limit = 10,
  total = 0,
  statusCode = 200
) => {
  const totalPages = Math.ceil(total / limit) || 1;
  
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages
    },
    timestamp: new Date().toISOString()
  });
};