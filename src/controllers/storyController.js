const { Story, Chapter, Choice, UserStoryProgress, User } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Get all available stories with user progress
 */
const getAllStories = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all active stories
    const stories = await Story.findAll({
      where: { isActive: true },
      include: [
        {
          model: Chapter,
          as: 'chapters',
          attributes: ['id', 'chapterNumber', 'title'],
          separate: true,
          order: [['chapterNumber', 'ASC']]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get user progress for all stories
    const userProgress = await UserStoryProgress.findAll({
      where: { userId },
      include: [
        {
          model: Chapter,
          as: 'currentChapter',
          attributes: ['id', 'chapterNumber', 'title']
        }
      ]
    });

    // Enrich stories with progress info
    const enrichedStories = stories.map(story => {
      const progress = userProgress.find(p => p.storyId === story.id);
      return {
        ...story.toJSON(),
        userProgress: progress || null
      };
    });

    res.json({
      success: true,
      stories: enrichedStories
    });
  } catch (error) {
    logger.error('Error getting stories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stories',
      error: error.message
    });
  }
};

/**
 * Get a specific story with all chapters and choices
 */
const getStoryById = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    const story = await Story.findByPk(storyId, {
      include: [
        {
          model: Chapter,
          as: 'chapters',
          include: [
            {
              model: Choice,
              as: 'choices',
              order: [['order', 'ASC']]
            }
          ],
          order: [['chapterNumber', 'ASC']]
        }
      ]
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check premium access
    const user = await User.findByPk(userId);
    if (story.isPremium && !user.isPremium) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required',
        isPremium: true
      });
    }

    // Get user progress
    const progress = await UserStoryProgress.findOne({
      where: { userId, storyId },
      include: [
        {
          model: Chapter,
          as: 'currentChapter'
        }
      ]
    });

    res.json({
      success: true,
      story,
      progress
    });
  } catch (error) {
    logger.error('Error getting story:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching story',
      error: error.message
    });
  }
};

/**
 * Start a new story
 */
const startStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    // Check if story exists
    const story = await Story.findByPk(storyId, {
      include: [
        {
          model: Chapter,
          as: 'chapters',
          where: { isStart: true },
          required: true
        }
      ]
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check premium access
    const user = await User.findByPk(userId);
    if (story.isPremium && !user.isPremium) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required'
      });
    }

    const firstChapter = story.chapters[0];
    if (!firstChapter) {
      return res.status(400).json({
        success: false,
        message: 'Story has no starting chapter'
      });
    }

    // Check if progress already exists
    let progress = await UserStoryProgress.findOne({
      where: { userId, storyId }
    });

    if (progress) {
      // Reset progress
      progress.currentChapterId = firstChapter.id;
      progress.completedChapterIds = [];
      progress.choicesMade = [];
      progress.totalAffectionGained = 0;
      progress.totalXpGained = 0;
      progress.startedAt = new Date();
      progress.lastPlayedAt = new Date();
      progress.completedAt = null;
      progress.playTime = 0;
      await progress.save();
    } else {
      // Create new progress
      progress = await UserStoryProgress.create({
        userId,
        storyId,
        currentChapterId: firstChapter.id,
        completedChapterIds: [],
        choicesMade: [],
        totalAffectionGained: 0,
        totalXpGained: 0
      });
    }

    // Increment play count
    await story.increment('playCount');

    // Get first chapter with choices
    const chapter = await Chapter.findByPk(firstChapter.id, {
      include: [
        {
          model: Choice,
          as: 'choices',
          order: [['order', 'ASC']]
        }
      ]
    });

    res.json({
      success: true,
      progress,
      chapter
    });
  } catch (error) {
    logger.error('Error starting story:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting story',
      error: error.message
    });
  }
};

/**
 * Make a choice and advance story
 */
const makeChoice = async (req, res) => {
  try {
    const { storyId, chapterId, choiceId } = req.body;
    const userId = req.user.id;

    // Get progress
    const progress = await UserStoryProgress.findOne({
      where: { userId, storyId }
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Story progress not found. Start the story first.'
      });
    }

    // Verify current chapter matches
    if (progress.currentChapterId !== chapterId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chapter. Not your current position.'
      });
    }

    // Get the choice
    const choice = await Choice.findByPk(choiceId);
    if (!choice || choice.chapterId !== chapterId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid choice'
      });
    }

    // Check requirements
    const user = await User.findByPk(userId);
    if (choice.requirements && choice.requirements.length > 0) {
      for (const req of choice.requirements) {
        let meetsRequirement = false;

        switch (req.type) {
          case 'affection':
            meetsRequirement = compareValue(user.affection || 0, req.value, req.comparison);
            break;
          case 'level':
            meetsRequirement = compareValue(user.level || 1, req.value, req.comparison);
            break;
          case 'premium':
            meetsRequirement = user.isPremium === req.value;
            break;
          default:
            meetsRequirement = true;
        }

        if (!meetsRequirement) {
          return res.status(403).json({
            success: false,
            message: req.errorMessage || 'Requirements not met for this choice'
          });
        }
      }
    }

    // Increment choice selected count
    await choice.increment('selectedCount');

    // Record choice
    const choicesMade = [...progress.choicesMade, {
      chapterId,
      choiceId,
      timestamp: new Date()
    }];

    // Add current chapter to completed
    const completedChapterIds = [...new Set([...progress.completedChapterIds, chapterId])];

    // Calculate rewards
    const affectionGained = choice.affectionChange;
    const xpGained = choice.xpChange;
    const totalAffectionGained = progress.totalAffectionGained + affectionGained;
    const totalXpGained = progress.totalXpGained + xpGained;

    // Apply rewards to user
    if (affectionGained !== 0) {
      await user.increment('affection', { by: affectionGained });
    }
    if (xpGained !== 0) {
      await user.increment('xp', { by: xpGained });
      // Check level up logic (if implemented)
    }

    // Update progress
    let isStoryComplete = false;
    let nextChapter = null;

    if (choice.nextChapterId) {
      // Continue to next chapter
      nextChapter = await Chapter.findByPk(choice.nextChapterId, {
        include: [
          {
            model: Choice,
            as: 'choices',
            order: [['order', 'ASC']]
          }
        ]
      });

      progress.currentChapterId = choice.nextChapterId;
    } else {
      // Story ended
      isStoryComplete = true;
      progress.completedAt = new Date();

      // Increment completion count
      const story = await Story.findByPk(storyId);
      await story.increment('completionCount');
    }

    progress.choicesMade = choicesMade;
    progress.completedChapterIds = completedChapterIds;
    progress.totalAffectionGained = totalAffectionGained;
    progress.totalXpGained = totalXpGained;
    progress.lastPlayedAt = new Date();
    await progress.save();

    res.json({
      success: true,
      progress,
      nextChapter,
      rewards: {
        affection: affectionGained,
        xp: xpGained
      },
      isStoryComplete
    });
  } catch (error) {
    logger.error('Error making choice:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing choice',
      error: error.message
    });
  }
};

/**
 * Get current chapter for a story
 */
const getCurrentChapter = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    const progress = await UserStoryProgress.findOne({
      where: { userId, storyId }
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Story not started yet'
      });
    }

    const chapter = await Chapter.findByPk(progress.currentChapterId, {
      include: [
        {
          model: Choice,
          as: 'choices',
          order: [['order', 'ASC']]
        }
      ]
    });

    res.json({
      success: true,
      chapter,
      progress
    });
  } catch (error) {
    logger.error('Error getting current chapter:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chapter',
      error: error.message
    });
  }
};

/**
 * Rate a completed story
 */
const rateStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { rating } = req.body;
    const userId = req.user.id;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const progress = await UserStoryProgress.findOne({
      where: { userId, storyId }
    });

    if (!progress || !progress.completedAt) {
      return res.status(400).json({
        success: false,
        message: 'Story not completed yet'
      });
    }

    progress.rating = rating;
    await progress.save();

    // Update story average rating
    const allRatings = await UserStoryProgress.findAll({
      where: {
        storyId,
        rating: { [Op.not]: null }
      },
      attributes: ['rating']
    });

    const averageRating = allRatings.reduce((sum, p) => sum + p.rating, 0) / allRatings.length;

    await Story.update(
      { averageRating },
      { where: { id: storyId } }
    );

    res.json({
      success: true,
      message: 'Rating saved',
      averageRating
    });
  } catch (error) {
    logger.error('Error rating story:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving rating',
      error: error.message
    });
  }
};

/**
 * Get story statistics
 */
const getStoryStats = async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findByPk(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Get all user progress
    const allProgress = await UserStoryProgress.findAll({
      where: { storyId }
    });

    const completionRate = story.playCount > 0
      ? (story.completionCount / story.playCount) * 100
      : 0;

    // Get popular choices
    const choices = await Choice.findAll({
      include: [
        {
          model: Chapter,
          as: 'chapter',
          where: { storyId }
        }
      ],
      order: [['selectedCount', 'DESC']],
      limit: 10
    });

    const stats = {
      storyId,
      totalPlays: story.playCount,
      totalCompletions: story.completionCount,
      completionRate: completionRate.toFixed(2),
      averageRating: story.averageRating.toFixed(2),
      popularChoices: choices.map(c => ({
        chapterId: c.chapterId,
        choiceId: c.id,
        text: c.text,
        count: c.selectedCount
      }))
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error getting story stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
};

// Helper function to compare values
function compareValue(actual, expected, comparison) {
  switch (comparison) {
    case 'gte':
      return actual >= expected;
    case 'lte':
      return actual <= expected;
    case 'eq':
      return actual === expected;
    default:
      return true;
  }
}

module.exports = {
  getAllStories,
  getStoryById,
  startStory,
  makeChoice,
  getCurrentChapter,
  rateStory,
  getStoryStats
};
