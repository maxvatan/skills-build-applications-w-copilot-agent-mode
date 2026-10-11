import 'dotenv/config';
import mongoose from 'mongoose';
import { Activity } from '../models/activity.js';
import { LeaderboardEntry } from '../models/leaderboard.js';
import { Team } from '../models/team.js';
import { User } from '../models/user.js';
import { Workout } from '../models/workout.js';

const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/octofit_db';

const teamSeeds = [
  { name: 'Trail Blazers', description: 'Outdoor miles and steady progress.' },
  { name: 'Power Pulse', description: 'Strength, conditioning, and consistency.' },
];

const userSeeds = [
  { username: 'alex-runner', email: 'alex@example.test', displayName: 'Alex Rivera', team: 'Trail Blazers' },
  { username: 'sam-cyclist', email: 'sam@example.test', displayName: 'Sam Chen', team: 'Trail Blazers' },
  { username: 'jamie-lifts', email: 'jamie@example.test', displayName: 'Jamie Morgan', team: 'Power Pulse' },
  { username: 'taylor-swims', email: 'taylor@example.test', displayName: 'Taylor Brooks', team: 'Power Pulse' },
];

const activitySeeds = [
  { username: 'alex-runner', activityType: 'running', durationMinutes: 32, distanceKm: 5.2, calories: 360, points: 52, loggedAt: '2026-10-09T07:30:00.000Z' },
  { username: 'alex-runner', activityType: 'walking', durationMinutes: 25, distanceKm: 2.1, calories: 110, points: 21, loggedAt: '2026-10-10T17:00:00.000Z' },
  { username: 'sam-cyclist', activityType: 'cycling', durationMinutes: 45, distanceKm: 16, calories: 410, points: 64, loggedAt: '2026-10-09T16:15:00.000Z' },
  { username: 'sam-cyclist', activityType: 'running', durationMinutes: 20, distanceKm: 3.1, calories: 220, points: 31, loggedAt: '2026-10-10T08:00:00.000Z' },
  { username: 'jamie-lifts', activityType: 'strength', durationMinutes: 40, distanceKm: 0, calories: 290, points: 40, loggedAt: '2026-10-09T18:00:00.000Z' },
  { username: 'jamie-lifts', activityType: 'cycling', durationMinutes: 22, distanceKm: 7.5, calories: 190, points: 28, loggedAt: '2026-10-10T12:00:00.000Z' },
  { username: 'taylor-swims', activityType: 'swimming', durationMinutes: 35, distanceKm: 1.4, calories: 320, points: 48, loggedAt: '2026-10-09T06:45:00.000Z' },
  { username: 'taylor-swims', activityType: 'walking', durationMinutes: 30, distanceKm: 2.8, calories: 140, points: 28, loggedAt: '2026-10-10T15:30:00.000Z' },
];

const workoutSeeds = [
  {
    title: 'First 5K',
    description: 'A gradual running session for building aerobic endurance.',
    category: 'running',
    difficulty: 'beginner',
    durationMinutes: 30,
    exercises: ['5-minute brisk walk', '20-minute easy run-walk intervals', '5-minute cooldown walk'],
  },
  {
    title: 'Full Body Foundations',
    description: 'A balanced strength session with simple bodyweight movements.',
    category: 'strength',
    difficulty: 'beginner',
    durationMinutes: 35,
    exercises: ['Bodyweight squats', 'Incline push-ups', 'Glute bridges', 'Dead bugs'],
  },
  {
    title: 'Tempo Ride',
    description: 'A cycling workout that alternates comfortable and challenging efforts.',
    category: 'cycling',
    difficulty: 'intermediate',
    durationMinutes: 40,
    exercises: ['10-minute easy warmup', '5 x 4-minute tempo intervals', '10-minute easy cooldown'],
  },
];

async function seedDatabase(): Promise<void> {
  await mongoose.connect(connectionString);
  console.log('Connected to octofit_db');

  try {
    const teams = new Map<string, mongoose.Types.ObjectId>();
    for (const seed of teamSeeds) {
      const team = await Team.findOneAndUpdate(
        { name: seed.name },
        { $set: seed },
        { upsert: true, returnDocument: 'after', runValidators: true },
      );
      teams.set(seed.name, team._id);
    }

    const users = new Map<string, mongoose.Types.ObjectId>();
    for (const seed of userSeeds) {
      const teamId = teams.get(seed.team);
      if (!teamId) {
        throw new Error(`Missing seeded team: ${seed.team}`);
      }
      const user = await User.findOneAndUpdate(
        { username: seed.username },
        {
          $set: {
            email: seed.email,
            displayName: seed.displayName,
            team: teamId,
          },
        },
        { upsert: true, returnDocument: 'after', runValidators: true },
      );
      users.set(seed.username, user._id);
    }

    const seededUserIds = [...users.values()];
    await Team.updateMany({}, { $pull: { members: { $in: seededUserIds } } });
    for (const [teamName, teamId] of teams) {
      const memberIds = userSeeds
        .filter((user) => user.team === teamName)
        .map((user) => users.get(user.username))
        .filter((id): id is mongoose.Types.ObjectId => id !== undefined);
      await Team.findByIdAndUpdate(
        teamId,
        { $addToSet: { members: { $each: memberIds } } },
        { runValidators: true },
      );
    }

    for (const seed of activitySeeds) {
      const { username, ...activity } = seed;
      const userId = users.get(username);
      if (!userId) {
        throw new Error(`Missing seeded user: ${username}`);
      }
      await Activity.findOneAndUpdate(
        { user: userId, loggedAt: new Date(activity.loggedAt) },
        { $set: { ...activity, user: userId, loggedAt: new Date(activity.loggedAt) } },
        { upsert: true, returnDocument: 'after', runValidators: true },
      );
    }

    const leaderboardTotals = await Activity.aggregate([
      { $match: { user: { $in: seededUserIds } } },
      { $group: { _id: '$user', points: { $sum: '$points' } } },
    ]);
    const pointsByUserId = new Map(
      leaderboardTotals.map((entry: { _id: mongoose.Types.ObjectId; points: number }) => [
        entry._id.toString(),
        entry.points,
      ]),
    );
    for (const userId of users.values()) {
      await LeaderboardEntry.findOneAndUpdate(
        { user: userId },
        { $set: { points: pointsByUserId.get(userId.toString()) ?? 0, period: 'all-time' } },
        { upsert: true, returnDocument: 'after', runValidators: true },
      );
    }

    for (const seed of workoutSeeds) {
      await Workout.findOneAndUpdate(
        { title: seed.title },
        { $set: seed },
        { upsert: true, returnDocument: 'after', runValidators: true },
      );
    }

    console.log(
      `Seeded ${userSeeds.length} users, ${teamSeeds.length} teams, ${activitySeeds.length} activities, ` +
        `${userSeeds.length} leaderboard entries, and ${workoutSeeds.length} workouts.`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase().catch((error: unknown) => {
  console.error('Error seeding database:', error);
  process.exitCode = 1;
});
