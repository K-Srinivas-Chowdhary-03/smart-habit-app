const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   POST /api/challenges/create
// @desc    Create a new challenge
// @access  Private
router.post('/create', protect, async (req, res) => {
  const { title, description, category, startDate, endDate, dailyTargetMinutes } = req.body;

  if (!title || !description || !category || !endDate) {
    return res.status(400).json({ message: 'Please provide title, description, category, and end date' });
  }

  try {
    const start = new Date(startDate || new Date());
    const end = new Date(endDate);
    
    // Normalize and calculate difference in days inclusive
    const startMidnight = new Date(start.toISOString().split('T')[0]);
    const endMidnight = new Date(end.toISOString().split('T')[0]);
    const diffTime = Math.abs(endMidnight - startMidnight);
    const calculatedDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newChallenge = new Challenge({
      title,
      description,
      category,
      durationInDays: calculatedDuration || 30,
      dailyTargetMinutes: dailyTargetMinutes || 30,
      startDate: startMidnight,
      endDate: endMidnight,
      creator: req.user._id,
      participants: [req.user._id] // Creator automatically participates
    });

    const challenge = await newChallenge.save();

    // Add challenge to creator's joined challenges
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { joinedChallenges: challenge._id }
    });

    res.status(201).json(challenge);
  } catch (error) {
    console.error('Challenge creation error:', error.message);
    res.status(500).json({ message: 'Server error creating challenge', error: error.message });
  }
});

// @route   GET /api/challenges
// @desc    Fetch all challenges
// @access  Public
router.get('/', async (req, res) => {
  try {
    const challenges = await Challenge.find()
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });
    res.json(challenges);
  } catch (error) {
    console.error('Fetch challenges error:', error.message);
    res.status(500).json({ message: 'Server error fetching challenges' });
  }
});

// @route   POST /api/challenges/join/:id
// @desc    Join a specific challenge
// @access  Private
router.post('/join/:id', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Check if user already participating in challenge
    const alreadyParticipating = challenge.participants.includes(req.user._id);
    if (alreadyParticipating) {
      return res.status(400).json({ message: 'You have already joined this challenge' });
    }

    // Add user to challenge participants
    challenge.participants.push(req.user._id);
    await challenge.save();

    // Add challenge to user's joined challenges
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { joinedChallenges: challenge._id }
    });

    res.json({
      message: 'Successfully joined the challenge',
      challengeId: challenge._id
    });
  } catch (error) {
    console.error('Join challenge error:', error.message);
    res.status(500).json({ message: 'Server error joining challenge', error: error.message });
  }
});

module.exports = router;
