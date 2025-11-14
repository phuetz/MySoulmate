/**
 * Role-Based Access Control (RBAC) System
 * Gère les permissions et l'accès basé sur les rôles
 */

// Définition des permissions disponibles
const PERMISSIONS = {
  // Utilisateurs
  'users:read': 'Voir les utilisateurs',
  'users:write': 'Modifier les utilisateurs',
  'users:delete': 'Supprimer les utilisateurs',
  'users:manage': 'Gérer tous les utilisateurs',

  // Compagnons
  'companions:read': 'Voir les compagnons',
  'companions:write': 'Modifier les compagnons',
  'companions:delete': 'Supprimer les compagnons',

  // Cadeaux
  'gifts:read': 'Voir les cadeaux',
  'gifts:write': 'Modifier les cadeaux',
  'gifts:delete': 'Supprimer les cadeaux',
  'gifts:purchase': 'Acheter des cadeaux',
  'gifts:manage': 'Gérer tous les cadeaux',

  // Calendrier
  'calendar:read': 'Voir le calendrier',
  'calendar:write': 'Modifier le calendrier',

  // Paiements
  'payments:read': 'Voir les paiements',
  'payments:manage': 'Gérer tous les paiements',
  'subscriptions:manage': 'Gérer les abonnements',

  // Administration
  'admin:metrics': 'Voir les métriques',
  'admin:logs': 'Voir les logs',
  'admin:settings': 'Modifier les paramètres',
  'admin:jobs': 'Gérer les tâches planifiées',

  // Modération
  'moderation:content': 'Modérer le contenu',
  'moderation:users': 'Modérer les utilisateurs',

  // GDPR
  'gdpr:export': 'Exporter ses données',
  'gdpr:delete': 'Supprimer son compte',
  'gdpr:manage': 'Gérer les demandes GDPR',
};

// Définition des rôles et leurs permissions
const ROLES = {
  user: {
    name: 'Utilisateur',
    description: 'Utilisateur standard',
    inherits: [],
    permissions: [
      'users:read', // Voir son propre profil
      'companions:read',
      'companions:write',
      'companions:delete',
      'gifts:read',
      'gifts:purchase',
      'calendar:read',
      'calendar:write',
      'payments:read', // Voir ses propres paiements
      'gdpr:export',
      'gdpr:delete',
    ],
  },

  premium: {
    name: 'Premium',
    description: 'Utilisateur premium avec fonctionnalités avancées',
    inherits: ['user'],
    permissions: [
      // Toutes les permissions de 'user' +
      'companions:write', // Compagnons multiples
      'gifts:write', // Personnalisation des cadeaux
    ],
  },

  moderator: {
    name: 'Modérateur',
    description: 'Modération du contenu et des utilisateurs',
    inherits: ['premium'],
    permissions: [
      'moderation:content',
      'moderation:users',
      'users:read', // Voir tous les utilisateurs
      'admin:logs',
    ],
  },

  admin: {
    name: 'Administrateur',
    description: 'Accès complet au système',
    inherits: ['moderator'],
    permissions: [
      'users:write',
      'users:delete',
      'users:manage',
      'gifts:manage',
      'payments:manage',
      'subscriptions:manage',
      'admin:metrics',
      'admin:settings',
      'admin:jobs',
      'gdpr:manage',
    ],
  },
};

/**
 * Récupère toutes les permissions d'un rôle (incluant les héritages)
 */
const getRolePermissions = (roleName) => {
  const role = ROLES[roleName];
  if (!role) {
    return [];
  }

  let permissions = [...role.permissions];

  // Ajouter les permissions des rôles hérités
  if (role.inherits && role.inherits.length > 0) {
    for (const inheritedRole of role.inherits) {
      const inheritedPermissions = getRolePermissions(inheritedRole);
      permissions = [...permissions, ...inheritedPermissions];
    }
  }

  // Retourner les permissions uniques
  return [...new Set(permissions)];
};

/**
 * Vérifie si un rôle a une permission spécifique
 */
const hasPermission = (roleName, permission) => {
  const permissions = getRolePermissions(roleName);
  return permissions.includes(permission);
};

/**
 * Vérifie si un rôle a toutes les permissions requises
 */
const hasAllPermissions = (roleName, requiredPermissions) => {
  const permissions = getRolePermissions(roleName);
  return requiredPermissions.every((perm) => permissions.includes(perm));
};

/**
 * Vérifie si un rôle a au moins une des permissions requises
 */
const hasAnyPermission = (roleName, requiredPermissions) => {
  const permissions = getRolePermissions(roleName);
  return requiredPermissions.some((perm) => permissions.includes(perm));
};

/**
 * Middleware pour vérifier une permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
      });
    }

    const userRole = req.user.role || 'user';

    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Permission insuffisante',
        required: permission,
        userRole,
      });
    }

    next();
  };
};

/**
 * Middleware pour vérifier plusieurs permissions (ET logique)
 */
const requireAllPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
      });
    }

    const userRole = req.user.role || 'user';

    if (!hasAllPermissions(userRole, permissions)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes',
        required: permissions,
        userRole,
      });
    }

    next();
  };
};

/**
 * Middleware pour vérifier plusieurs permissions (OU logique)
 */
const requireAnyPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
      });
    }

    const userRole = req.user.role || 'user';

    if (!hasAnyPermission(userRole, permissions)) {
      return res.status(403).json({
        success: false,
        message: 'Aucune des permissions requises trouvée',
        required: permissions,
        userRole,
      });
    }

    next();
  };
};

/**
 * Middleware pour vérifier la propriété de la ressource OU permission admin
 */
const requireOwnershipOr = (permission, getResourceOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
      });
    }

    const userRole = req.user.role || 'user';
    const userId = req.user.id;

    try {
      // Vérifier si l'utilisateur a la permission bypass
      if (hasPermission(userRole, permission)) {
        return next();
      }

      // Sinon, vérifier la propriété
      const resourceOwnerId = await getResourceOwnerId(req);

      if (userId === resourceOwnerId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette ressource',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des permissions',
      });
    }
  };
};

/**
 * Récupère les informations d'un rôle
 */
const getRoleInfo = (roleName) => {
  const role = ROLES[roleName];
  if (!role) {
    return null;
  }

  return {
    name: role.name,
    description: role.description,
    permissions: getRolePermissions(roleName),
  };
};

/**
 * Liste tous les rôles disponibles
 */
const listAllRoles = () => {
  return Object.keys(ROLES).map((roleName) => ({
    key: roleName,
    ...getRoleInfo(roleName),
  }));
};

/**
 * Liste toutes les permissions disponibles
 */
const listAllPermissions = () => {
  return Object.entries(PERMISSIONS).map(([key, description]) => ({
    key,
    description,
  }));
};

/**
 * Vérifie si un rôle peut effectuer une action sur une ressource
 */
const canAccess = (roleName, resource, action) => {
  const permission = `${resource}:${action}`;
  return hasPermission(roleName, permission);
};

/**
 * Middleware conditionnel basé sur le plan d'abonnement
 */
const requireSubscriptionTier = (minTier = 'premium') => {
  const tiers = ['user', 'premium', 'ultimate'];
  const minTierIndex = tiers.indexOf(minTier);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
      });
    }

    // Les admins ont accès à tout
    if (req.user.role === 'admin') {
      return next();
    }

    const userTier = req.user.subscriptionTier || 'user';
    const userTierIndex = tiers.indexOf(userTier);

    if (userTierIndex < minTierIndex) {
      return res.status(403).json({
        success: false,
        message: `Abonnement ${minTier} requis`,
        userTier,
        requiredTier: minTier,
      });
    }

    next();
  };
};

module.exports = {
  PERMISSIONS,
  ROLES,
  getRolePermissions,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  requireOwnershipOr,
  getRoleInfo,
  listAllRoles,
  listAllPermissions,
  canAccess,
  requireSubscriptionTier,
};
