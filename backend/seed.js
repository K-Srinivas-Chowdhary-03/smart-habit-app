const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Challenge = require('./models/Challenge');
const Progress = require('./models/Progress');

dotenv.config();

const normalizeDateStr = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smarthabit');
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Challenge.deleteMany({});
    await Progress.deleteMany({});
    console.log('Database cleared.');

    // 1. Create Mock Users (Passwords will be hashed automatically by UserSchema pre-save hook)
    const users = await User.create([
      {
        name: 'Alex Coder',
        email: 'alex@example.com',
        password: 'password123',
        points: 250
      },
      {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        points: 180
      },
      {
        name: 'John Smith',
        email: 'john@example.com',
        password: 'password123',
        points: 90
      },
      {
        name: 'Sarah Runner',
        email: 'sarah@example.com',
        password: 'password123',
        points: 310
      }
    ]);

    const [alex, jane, john, sarah] = users;
    console.log('Mock users created.');

    // 2. Create Challenges
    const challenges = await Challenge.create([
      {
        title: '30-Day JavaScript Mastery',
        description: 'Spend daily time practicing core JS concepts, solving algorithms, and building interactive UI components.',
        category: 'Coding',
        durationInDays: 30,
        dailyTargetMinutes: 60,
        creator: alex._id,
        participants: [alex._id, jane._id, john._id],
        startDate: new Date(normalizeDateStr(10)),
        endDate: new Date(normalizeDateStr(-19))
      },
      {
        title: '21-Day Mindful Meditation',
        description: 'Reset your mind and build deep focus with a daily guided mindfulness or breathing meditation.',
        category: 'Meditation',
        durationInDays: 21,
        dailyTargetMinutes: 15,
        creator: john._id,
        participants: [john._id, sarah._id, alex._id],
        startDate: new Date(normalizeDateStr(5)),
        endDate: new Date(normalizeDateStr(-15))
      },
      {
        title: 'Daily Fitness Cardio Run',
        description: 'Complete a running routine or a high-intensity cardio session to boost your heart rate and endurance.',
        category: 'Fitness',
        durationInDays: 30,
        dailyTargetMinutes: 45,
        creator: sarah._id,
        participants: [sarah._id, jane._id, alex._id],
        startDate: new Date(normalizeDateStr(8)),
        endDate: new Date(normalizeDateStr(-21))
      },
      {
        title: '30-Day Non-Fiction Reading',
        description: 'Read at least 20 pages of a self-improvement, science, business, or historical non-fiction book every day.',
        category: 'Reading',
        durationInDays: 30,
        dailyTargetMinutes: 20,
        creator: jane._id,
        participants: [jane._id, sarah._id],
        startDate: new Date(normalizeDateStr(15)),
        endDate: new Date(normalizeDateStr(-14))
      }
    ]);

    const [codingChallenge, meditationChallenge, fitnessChallenge, readingChallenge] = challenges;
    console.log('Mock challenges created.');

    // Update users' joinedChallenges references
    alex.joinedChallenges = [codingChallenge._id, meditationChallenge._id, fitnessChallenge._id];
    jane.joinedChallenges = [codingChallenge._id, fitnessChallenge._id, readingChallenge._id];
    john.joinedChallenges = [codingChallenge._id, meditationChallenge._id];
    sarah.joinedChallenges = [meditationChallenge._id, fitnessChallenge._id, readingChallenge._id];

    await Promise.all([alex.save(), jane.save(), john.save(), sarah.save()]);
    console.log('User-challenge associations established.');

    // 3. Seed Progress Logs (creating realistic streaks)
    // We will seed logs for the past 5 days (daysAgo = 0, 1, 2, 3, 4)
    const progressLogs = [];

    // Alex Coder (Streaks: 5 days completed on Coding, 4 days completed on Meditation)
    for (let day = 0; day <= 4; day++) {
      progressLogs.push({
        userId: alex._id,
        challengeId: codingChallenge._id,
        date: new Date(normalizeDateStr(day)),
        status: 'Completed',
        proofOfWork: `Solved LeetCode daily problem. Day ${30 - day} of 30.`
      });
    }
    for (let day = 1; day <= 4; day++) {
      progressLogs.push({
        userId: alex._id,
        challengeId: meditationChallenge._id,
        date: new Date(normalizeDateStr(day)),
        status: 'Completed',
        proofOfWork: 'Completed 15 min focus breathing via Calm.'
      });
    }
    // Alex missed today's meditation
    progressLogs.push({
      userId: alex._id,
      challengeId: meditationChallenge._id,
      date: new Date(normalizeDateStr(0)),
      status: 'Missed',
      proofOfWork: 'Was traveling, skipped.'
    });

    // Jane Doe (Streaks: 4 days completed on Coding, 3 days completed on Reading)
    for (let day = 0; day <= 3; day++) {
      progressLogs.push({
        userId: jane._id,
        challengeId: codingChallenge._id,
        date: new Date(normalizeDateStr(day)),
        status: 'Completed',
        proofOfWork: 'Completed dashboard design implementation.'
      });
    }
    // Jane missed day 4 of coding
    progressLogs.push({
      userId: jane._id,
      challengeId: codingChallenge._id,
      date: new Date(normalizeDateStr(4)),
      status: 'Missed'
    });
    for (let day = 1; day <= 3; day++) {
      progressLogs.push({
        userId: jane._id,
        challengeId: readingChallenge._id,
        date: new Date(normalizeDateStr(day)),
        status: 'Completed',
        proofOfWork: 'Read 25 pages of Atomic Habits.'
      });
    }

    // Sarah Runner (Streaks: 5 days completed on Fitness)
    for (let day = 0; day <= 4; day++) {
      progressLogs.push({
        userId: sarah._id,
        challengeId: fitnessChallenge._id,
        date: new Date(normalizeDateStr(day)),
        status: 'Completed',
        proofOfWork: 'Ran 5.2K around the central park. Beat pace by 12s!'
      });
    }

    // Insert progress logs
    await Progress.insertMany(progressLogs);
    console.log('Mock progress logs created.');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
