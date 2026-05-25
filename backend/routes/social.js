const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const Progress = require('../models/Progress');
const { protect } = require('../middleware/auth');

// Helper to calculate streaks from YYYY-MM-DD strings (duplicated for isolated route calculation if needed, or imported if we had a util, keeping it standalone is simple and robust)
const calculateStreakFromDates = (dateStrings) => {
  if (!dateStrings || dateStrings.length === 0) return 0;
  const uniqueDates = [...new Set(dateStrings)].sort((a, b) => new Date(b) - new Date(a));
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) {
    return 0;
  }

  let streak = 1;
  let currentDate = new Date(uniqueDates[0]);

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i]);
    const diffTime = Math.abs(currentDate - prevDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
      currentDate = prevDate;
    } else if (diffDays > 1) {
      break;
    }
  }
  return streak;
};

// @route   GET /api/social/leaderboard
// @desc    Get global leaderboard (ranked by points)
// @access  Private
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const leaderboard = await User.find()
      .select('name email points')
      .sort({ points: -1 })
      .limit(50);
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Fetch global leaderboard error:', error.message);
    res.status(500).json({ message: 'Server error fetching global leaderboard' });
  }
});

// @route   GET /api/social/leaderboard/:challengeId
// @desc    Rank users in a specific challenge based on habit completion/streak
// @access  Private
router.get('/leaderboard/:challengeId', protect, async (req, res) => {
  try {
    const { challengeId } = req.params;

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Get all participants of this challenge
    const participants = await User.find({
      _id: { $in: challenge.participants }
    }).select('name email points');

    // Get all progress logs for this challenge
    const logs = await Progress.find({ challengeId });

    // Aggregate statistics for each user
    const userStats = participants.map((user) => {
      const userLogs = logs.filter(
        (log) => log.userId.toString() === user._id.toString()
      );

      const completedLogs = userLogs.filter((log) => log.status === 'Completed');
      const completedCount = completedLogs.length;

      // Extract completed date strings
      const completedDates = completedLogs.map(
        (log) => log.date.toISOString().split('T')[0]
      );

      // Compute streak
      const activeStreak = calculateStreakFromDates(completedDates);

      // Completion percentage
      const percentage = challenge.durationInDays > 0
        ? Math.round((completedCount / challenge.durationInDays) * 100)
        : 0;

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        points: user.points, // Global points
        completedCount,
        streak: activeStreak,
        completionPercentage: Math.min(100, percentage)
      };
    });

    // Sort by active streak descending, then completion rate, then points
    userStats.sort((a, b) => {
      if (b.streak !== a.streak) {
        return b.streak - a.streak;
      }
      if (b.completionPercentage !== a.completionPercentage) {
        return b.completionPercentage - a.completionPercentage;
      }
      return b.points - a.points;
    });

    res.json({
      challengeTitle: challenge.title,
      leaderboard: userStats
    });
  } catch (error) {
    console.error('Fetch challenge leaderboard error:', error.message);
    res.status(500).json({ message: 'Server error fetching challenge leaderboard' });
  }
});

module.exports = router;
