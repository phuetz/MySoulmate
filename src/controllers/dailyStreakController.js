const { DailyStreak, User } = require('../models');
const logger = require('../utils/logger');

// Streak rewards configuration
const STREAK_REWARDS = {
  1: { coins: 10, xp: 25 },
  3: { coins: 50, xp: 100, unlock: 'day3_badge' },
  7: { coins: 150, xp: 300, unlock: 'week_warrior_badge' },
  14: { coins: 300, xp: 500, unlock: 'fortnight_champion' },
  30: { coins: 1000, xp: 1500, unlock: 'monthly_legend_badge' },
  100: { coins: 5000, xp: 5000, unlock: 'century_master_badge', lifetimeDiscount: 50 }
};

/**
 * Get user's streak information
 */
const getStreakInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    let streak = await DailyStreak.findOne({ where: { userId } });

    if (!streak) {
      // Create streak record if doesn't exist
      streak = await DailyStreak.create({ userId });
    }

    // Check if streak should be reset
    if (streak.lastCheckIn) {
      const lastCheckIn = new Date(streak.lastCheckIn);
      const now = new Date();
      const hoursSinceLastCheckIn = (now - lastCheckIn) / (1000 * 60 * 60);

      // Reset if more than 48 hours (grace period for timezone issues)
      if (hoursSinceLastCheckIn > 48) {
        streak.currentStreak = 0;
        await streak.save();
      }
    }

    // Get available milestones
    const availableMilestones = Object.keys(STREAK_REWARDS)
      .map(day => parseInt(day))
      .filter(day =>
        streak.currentStreak >= day &&
        !streak.milestonesClaimed.includes(day)
      );

    res.json({
      success: true,
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastCheckIn: streak.lastCheckIn,
        canCheckIn: canCheckInToday(streak),
        totalCoinsEarned: streak.totalCoinsEarned,
        totalXpEarned: streak.totalXpEarned,
        availableMilestones,
        nextMilestone: getNextMilestone(streak.currentStreak),
        checkInHistory: streak.checkInHistory
      }
    });
  } catch (error) {
    logger.error('Error getting streak info:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching streak info',
      error: error.message
    });
  }
};

/**
 * Check in for the day
 */
const checkIn = async (req, res) => {
  try {
    const userId = req.user.id;

    let streak = await DailyStreak.findOne({ where: { userId } });

    if (!streak) {
      streak = await DailyStreak.create({ userId });
    }

    // Verify can check in
    if (!canCheckInToday(streak)) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today. Come back tomorrow!'
      });
    }

    const now = new Date();
    const lastCheckIn = streak.lastCheckIn ? new Date(streak.lastCheckIn) : null;

    // Calculate new streak
    let newStreak = streak.currentStreak;

    if (!lastCheckIn) {
      // First check-in ever
      newStreak = 1;
    } else {
      const hoursSinceLastCheckIn = (now - lastCheckIn) / (1000 * 60 * 60);

      if (hoursSinceLastCheckIn >= 24 && hoursSinceLastCheckIn < 48) {
        // Consecutive day
        newStreak += 1;
      } else if (hoursSinceLastCheckIn >= 48) {
        // Streak broken
        newStreak = 1;
      }
    }

    // Get rewards for current streak day
    const dailyReward = STREAK_REWARDS[newStreak] || STREAK_REWARDS[1];
    const coins = dailyReward.coins;
    const xp = dailyReward.xp;

    // Update user
    const user = await User.findByPk(userId);
    await user.increment('coins', { by: coins });
    await user.increment('xp', { by: xp });

    // Update streak
    streak.currentStreak = newStreak;
    streak.longestStreak = Math.max(streak.longestStreak, newStreak);
    streak.lastCheckIn = now;
    streak.totalCoinsEarned += coins;
    streak.totalXpEarned += xp;
    streak.checkInHistory = [...streak.checkInHistory, now.toISOString()];
    await streak.save();

    res.json({
      success: true,
      checkIn: {
        streak: newStreak,
        rewards: { coins, xp },
        unlocked: dailyReward.unlock || null,
        isNewRecord: newStreak === streak.longestStreak && newStreak > 1
      }
    });
  } catch (error) {
    logger.error('Error checking in:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing check-in',
      error: error.message
    });
  }
};

/**
 * Claim milestone reward
 */
const claimMilestone = async (req, res) => {
  try {
    const userId = req.user.id;
    const { day } = req.body;

    if (!STREAK_REWARDS[day]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid milestone day'
      });
    }

    const streak = await DailyStreak.findOne({ where: { userId } });

    if (!streak) {
      return res.status(404).json({
        success: false,
        message: 'Streak not found'
      });
    }

    // Check if eligible
    if (streak.currentStreak < day) {
      return res.status(403).json({
        success: false,
        message: `Need ${day} day streak to claim this reward`
      });
    }

    // Check if already claimed
    if (streak.milestonesClaimed.includes(day)) {
      return res.status(400).json({
        success: false,
        message: 'Milestone already claimed'
      });
    }

    const reward = STREAK_REWARDS[day];
    const user = await User.findByPk(userId);

    // Award bonus rewards
    if (reward.coins) {
      await user.increment('coins', { by: reward.coins });
    }
    if (reward.xp) {
      await user.increment('xp', { by: reward.xp });
    }

    // Update milestones claimed
    streak.milestonesClaimed = [...streak.milestonesClaimed, day];
    streak.totalCoinsEarned += reward.coins || 0;
    streak.totalXpEarned += reward.xp || 0;
    await streak.save();

    res.json({
      success: true,
      milestone: {
        day,
        rewards: reward,
        claimed: true
      }
    });
  } catch (error) {
    logger.error('Error claiming milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Error claiming milestone',
      error: error.message
    });
  }
};

/**
 * Get leaderboard (top streaks)
 */
const getLeaderboard = async (req, res) => {
  try {
    const topStreaks = await DailyStreak.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatarUrl']
        }
      ],
      order: [['currentStreak', 'DESC']],
      limit: 100
    });

    res.json({
      success: true,
      leaderboard: topStreaks.map((streak, index) => ({
        rank: index + 1,
        userId: streak.user.id,
        userName: streak.user.name,
        avatarUrl: streak.user.avatarUrl,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak
      }))
    });
  } catch (error) {
    logger.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
};

// Helper functions
function canCheckInToday(streak) {
  if (!streak.lastCheckIn) return true;

  const lastCheckIn = new Date(streak.lastCheckIn);
  const now = new Date();

  // Check if last check-in was today
  return (
    lastCheckIn.getFullYear() !== now.getFullYear() ||
    lastCheckIn.getMonth() !== now.getMonth() ||
    lastCheckIn.getDate() !== now.getDate()
  );
}

function getNextMilestone(currentStreak) {
  const milestones = Object.keys(STREAK_REWARDS).map(d => parseInt(d)).sort((a, b) => a - b);
  const next = milestones.find(m => m > currentStreak);
  return next ? {
    day: next,
    reward: STREAK_REWARDS[next],
    daysRemaining: next - currentStreak
  } : null;
}

module.exports = {
  getStreakInfo,
  checkIn,
  claimMilestone,
  getLeaderboard
};
