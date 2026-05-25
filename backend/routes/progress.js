const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const { protect } = require('../middleware/auth');

// Helper to normalize date to UTC Midnight (YYYY-MM-DD format as a Date object)
const normalizeToDateString = (dateInput) => {
  const d = new Date(dateInput);
  return d.toISOString().split('T')[0]; // Yields "YYYY-MM-DD"
};

// Helper to calculate streaks from an array of date strings (format: YYYY-MM-DD)
const calculateStreakFromDates = (dateStrings) => {
  if (!dateStrings || dateStrings.length === 0) return 0;

  // Remove duplicates and sort descending
  const uniqueDates = [...new Set(dateStrings)].sort((a, b) => new Date(b) - new Date(a));

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // If the user hasn't completed the habit today OR yesterday, the active streak is broken (0)
  if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  let currentDate = new Date(uniqueDates[0]); // Start with the most recent completion

  // Double check if the most recent completion is indeed today or yesterday
  const mostRecentStr = uniqueDates[0];
  if (mostRecentStr !== todayStr && mostRecentStr !== yesterdayStr) {
    return 0;
  }

  streak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i]);
    const diffTime = Math.abs(currentDate - prevDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
      currentDate = prevDate;
    } else if (diffDays > 1) {
      // Gap found, streak breaks here
      break;
    }
    // If diffDays is 0 (duplicate), we ignore and continue
  }

  return streak;
};

// @route   POST /api/progress/log
// @desc    Log daily progress for a challenge
// @access  Private
router.post('/log', protect, async (req, res) => {
  const { challengeId, date, status, proofOfWork } = req.body;

  if (!challengeId || !status) {
    return res.status(400).json({ message: 'Please provide challengeId and status' });
  }

  try {
    // 1. Verify user actually joined the challenge
    const user = await User.findById(req.user._id);
    if (!user.joinedChallenges.includes(challengeId)) {
      return res.status(400).json({ message: 'You must join this challenge before logging progress' });
    }

    // 2. Normalize the date to date-only string to avoid time offsets
    const dateStr = normalizeToDateString(date || new Date());
    const todayStr = normalizeToDateString(new Date());

    if (dateStr !== todayStr) {
      return res.status(400).json({ message: 'Check-in is only allowed for the current calendar day!' });
    }

    const normalizedDate = new Date(dateStr);

    // 3. Find if a log already exists for this day
    const existingLog = await Progress.findOne({
      userId: req.user._id,
      challengeId,
      date: normalizedDate
    });

    let pointDelta = 0;

    if (existingLog) {
      // If updating status
      if (existingLog.status !== status) {
        if (status === 'Completed') {
          pointDelta = 10;
        } else if (status === 'Missed') {
          pointDelta = -10;
        }
      }
      existingLog.status = status;
      existingLog.proofOfWork = proofOfWork || '';
      await existingLog.save();
    } else {
      // Create new progress log
      const newLog = new Progress({
        userId: req.user._id,
        challengeId,
        date: normalizedDate,
        status,
        proofOfWork: proofOfWork || ''
      });
      await newLog.save();

      if (status === 'Completed') {
        pointDelta = 10;
      }
    }

    // 4. Update user points if there is a difference
    let updatedPoints = user.points;
    if (pointDelta !== 0) {
      user.points = Math.max(0, user.points + pointDelta); // Ensure points don't go below 0
      await user.save();
      updatedPoints = user.points;
    }

    res.json({
      message: 'Progress logged successfully',
      points: updatedPoints,
      log: existingLog || { userId: req.user._id, challengeId, date: normalizedDate, status, proofOfWork }
    });
  } catch (error) {
    console.error('Progress logging error:', error.message);
    res.status(500).json({ message: 'Server error logging progress', error: error.message });
  }
});

// @route   GET /api/progress/user/:userId
// @desc    Get user's entire streak and history
// @access  Private
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch user
    const user = await User.findById(userId).populate('joinedChallenges');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch all progress logs for this user
    const logs = await Progress.find({ userId }).sort({ date: -1 });

    // Calculate streaks per challenge
    const challengeStreaks = {};
    const challengeStats = {};

    user.joinedChallenges.forEach((challenge) => {
      const challengeLogs = logs.filter(
        (log) => log.challengeId.toString() === challenge._id.toString()
      );

      // 1. Generate chronological date range from startDate to today (or endDate if finished)
      const start = new Date(challenge.startDate.toISOString().split('T')[0]);
      const end = new Date(challenge.endDate.toISOString().split('T')[0]);
      const today = new Date(new Date().toISOString().split('T')[0]);
      
      const endChecking = today < end ? today : end;
      
      const dateList = [];
      let curr = new Date(start);
      while (curr <= endChecking) {
        dateList.push(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 1);
      }

      // 2. Map database logs and fill unrecorded past gaps with virtual "Missed" logs
      const injectedLogs = [];
      
      // Keep track of database logs to avoid adding virtual logs for days already recorded
      const dbDates = challengeLogs.map(l => l.date.toISOString().split('T')[0]);

      // Push existing database logs
      challengeLogs.forEach(l => injectedLogs.push(l));

      // Inject virtual "Missed" logs for unlogged past days
      dateList.forEach((dateStr) => {
        if (!dbDates.includes(dateStr) && dateStr !== today.toISOString().split('T')[0]) {
          injectedLogs.push({
            _id: `virtual-${challenge._id}-${dateStr}`,
            userId: user._id,
            challengeId: challenge._id,
            date: new Date(dateStr),
            status: 'Missed',
            proofOfWork: 'No check-in recorded'
          });
        }
      });

      // Sort chronological descending
      injectedLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

      const completedDates = injectedLogs
        .filter((log) => log.status === 'Completed')
        .map((log) => log.date.toISOString().split('T')[0]);

      const currentStreak = calculateStreakFromDates(completedDates);
      
      // 3. Compute dynamic Consistency Rating: completed days out of active elapsed days
      const totalCompleted = injectedLogs.filter((log) => log.status === 'Completed').length;
      const elapsedDays = dateList.length;
      const percentage = elapsedDays > 0 
        ? Math.round((totalCompleted / elapsedDays) * 100) 
        : 0;

      challengeStreaks[challenge._id] = currentStreak;
      challengeStats[challenge._id] = {
        streak: currentStreak,
        completedCount: totalCompleted,
        percentage: Math.min(100, percentage),
        history: injectedLogs
      };
    });

    // Calculate Overall Platform Streak (days where at least ONE habit was completed)
    const allCompletedDates = logs
      .filter((log) => log.status === 'Completed')
      .map((log) => log.date.toISOString().split('T')[0]);

    const overallStreak = calculateStreakFromDates(allCompletedDates);

    res.json({
      userId,
      points: user.points,
      joinedChallenges: user.joinedChallenges,
      overallStreak,
      challengeStreaks,
      challengeStats,
      rawLogs: logs
    });
  } catch (error) {
    console.error('Fetch progress error:', error.message);
    res.status(500).json({ message: 'Server error fetching progress details' });
  }
});

module.exports = router;
