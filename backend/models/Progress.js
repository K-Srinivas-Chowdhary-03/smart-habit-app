const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Completed', 'Missed']
  },
  proofOfWork: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound unique index so a user can log progress only once per challenge per calendar day
ProgressSchema.index({ userId: 1, challengeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Progress', ProgressSchema);
