const { Memory } = require('../models');
const { Op } = require('sequelize');
const { logger } = require('../config/logger');

/**
 * Service de mémoire long terme pour les compagnons IA
 * Inspiré de Replika, Zeta et Character.AI
 */

/**
 * Crée une nouvelle mémoire
 */
exports.createMemory = async ({
  userId,
  companionId,
  memoryType,
  category,
  content,
  importance = 5,
  emotionalWeight = 0,
  context = {},
  source = 'conversation',
}) => {
  try {
    const memory = await Memory.create({
      userId,
      companionId,
      memoryType,
      category,
      content,
      importance,
      emotionalWeight,
      context,
      source,
      confidence: 1.0,
      isActive: true,
    });

    logger.info('Memory created:', {
      memoryId: memory.id,
      userId,
      companionId,
      type: memoryType,
    });

    return memory;
  } catch (error) {
    logger.error('Failed to create memory:', error);
    throw error;
  }
};

/**
 * Récupère les mémoires pertinentes pour un contexte
 */
exports.getRelevantMemories = async (userId, companionId, options = {}) => {
  const {
    memoryTypes = null,
    category = null,
    minImportance = 3,
    limit = 20,
    includeInactive = false,
  } = options;

  try {
    const whereClause = {
      userId,
      companionId,
      importance: { [Op.gte]: minImportance },
    };

    if (!includeInactive) {
      whereClause.isActive = true;
    }

    if (memoryTypes && memoryTypes.length > 0) {
      whereClause.memoryType = { [Op.in]: memoryTypes };
    }

    if (category) {
      whereClause.category = category;
    }

    // Exclure les mémoires expirées
    whereClause[Op.or] = [
      { expiresAt: null },
      { expiresAt: { [Op.gt]: new Date() } },
    ];

    const memories = await Memory.findAll({
      where: whereClause,
      order: [
        ['importance', 'DESC'],
        ['recallCount', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit,
    });

    // Mettre à jour le compteur de rappel
    const memoryIds = memories.map((m) => m.id);
    if (memoryIds.length > 0) {
      await Memory.update(
        {
          lastRecalled: new Date(),
          recallCount: sequelize.literal('recallCount + 1'),
        },
        {
          where: { id: { [Op.in]: memoryIds } },
        }
      );
    }

    return memories;
  } catch (error) {
    logger.error('Failed to get relevant memories:', error);
    throw error;
  }
};

/**
 * Recherche dans les mémoires
 */
exports.searchMemories = async (userId, companionId, query, options = {}) => {
  const { limit = 10 } = options;

  try {
    const memories = await Memory.findAll({
      where: {
        userId,
        companionId,
        isActive: true,
        [Op.or]: [
          { content: { [Op.like]: `%${query}%` } },
          { category: { [Op.like]: `%${query}%` } },
        ],
      },
      order: [
        ['importance', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit,
    });

    return memories;
  } catch (error) {
    logger.error('Failed to search memories:', error);
    throw error;
  }
};

/**
 * Met à jour une mémoire existante
 */
exports.updateMemory = async (memoryId, updates) => {
  try {
    const memory = await Memory.findByPk(memoryId);

    if (!memory) {
      throw new Error('Memory not found');
    }

    await memory.update(updates);

    logger.info('Memory updated:', { memoryId, updates });

    return memory;
  } catch (error) {
    logger.error('Failed to update memory:', error);
    throw error;
  }
};

/**
 * Archive une mémoire (soft delete)
 */
exports.archiveMemory = async (memoryId) => {
  try {
    const memory = await Memory.findByPk(memoryId);

    if (!memory) {
      throw new Error('Memory not found');
    }

    await memory.update({ isActive: false });

    logger.info('Memory archived:', { memoryId });

    return memory;
  } catch (error) {
    logger.error('Failed to archive memory:', error);
    throw error;
  }
};

/**
 * Obtient les statistiques de mémoire
 */
exports.getMemoryStats = async (userId, companionId) => {
  try {
    const stats = {
      total: 0,
      byType: {},
      byCategory: {},
      averageImportance: 0,
      mostRecalled: null,
      recentMemories: [],
    };

    // Total et moyenne
    const allMemories = await Memory.findAll({
      where: { userId, companionId, isActive: true },
      attributes: ['memoryType', 'category', 'importance'],
    });

    stats.total = allMemories.length;

    if (allMemories.length > 0) {
      stats.averageImportance =
        allMemories.reduce((sum, m) => sum + m.importance, 0) / allMemories.length;

      // Par type
      stats.byType = allMemories.reduce((acc, m) => {
        acc[m.memoryType] = (acc[m.memoryType] || 0) + 1;
        return acc;
      }, {});

      // Par catégorie
      stats.byCategory = allMemories.reduce((acc, m) => {
        if (m.category) {
          acc[m.category] = (acc[m.category] || 0) + 1;
        }
        return acc;
      }, {});
    }

    // Mémoire la plus rappelée
    stats.mostRecalled = await Memory.findOne({
      where: { userId, companionId, isActive: true },
      order: [['recallCount', 'DESC']],
    });

    // Mémoires récentes
    stats.recentMemories = await Memory.findAll({
      where: { userId, companionId, isActive: true },
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    return stats;
  } catch (error) {
    logger.error('Failed to get memory stats:', error);
    throw error;
  }
};

/**
 * Extrait des mémoires d'une conversation (IA-assisted)
 */
exports.extractMemoriesFromConversation = async (userId, companionId, conversation) => {
  // Cette fonction utiliserait l'IA pour extraire automatiquement des faits,
  // préférences, et informations importantes de la conversation
  // Pour l'instant, c'est un placeholder

  const extractedMemories = [];

  // TODO: Implémenter l'extraction par IA
  // - Utiliser OpenAI ou un modèle local
  // - Identifier les faits importants
  // - Catégoriser automatiquement
  // - Assigner importance et émotion

  logger.info('Memory extraction placeholder called', {
    userId,
    companionId,
    conversationLength: conversation.length,
  });

  return extractedMemories;
};

/**
 * Consolide les mémoires similaires ou redondantes
 */
exports.consolidateMemories = async (userId, companionId) => {
  try {
    // Cette fonction regrouperait et fusionnerait les mémoires similaires
    // pour éviter la redondance et améliorer l'efficacité

    // TODO: Implémenter la consolidation
    // - Trouver les mémoires similaires (embedding similarity)
    // - Fusionner les informations
    // - Garder la plus importante
    // - Archiver les duplicatas

    logger.info('Memory consolidation placeholder called', {
      userId,
      companionId,
    });

    return { consolidated: 0 };
  } catch (error) {
    logger.error('Failed to consolidate memories:', error);
    throw error;
  }
};

/**
 * Nettoie les mémoires expirées
 */
exports.cleanupExpiredMemories = async () => {
  try {
    const result = await Memory.update(
      { isActive: false },
      {
        where: {
          expiresAt: {
            [Op.lte]: new Date(),
          },
          isActive: true,
        },
      }
    );

    logger.info(`Cleaned up ${result[0]} expired memories`);

    return { archived: result[0] };
  } catch (error) {
    logger.error('Failed to cleanup expired memories:', error);
    throw error;
  }
};
