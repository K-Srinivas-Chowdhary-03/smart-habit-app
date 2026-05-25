const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a challenge title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a challenge description'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Coding', 'Fitness', 'Reading', 'Meditation']
  },
  durationInDays: {
    type: Number,
    default: 30,
    min: [1, 'Duration must be at least 1 day']
  },
  dailyTargetMinutes: {
    type: Number,
    default: 30,
    min: [1, 'Daily target must be at least 1 minute']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'Please add a challenge end date']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Challenge', ChallengeSchema);
