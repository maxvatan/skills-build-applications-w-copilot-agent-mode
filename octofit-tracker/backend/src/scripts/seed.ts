import 'dotenv/config';
import mongoose from 'mongoose';
import { Activity } from '../models/activity.js';
import { Leaderboard } from '../models/leaderboard.js';
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

/**
 * Seed the octofit_db database with test data (run with `npm run seed`)
 */
async function seedDatabase(): Promise<void> {
  await mongoose.connect(connectionString);
  console.log('Connected to octofit_db');

  try {
    // Remove previously seeded records so the command can be rerun safely.
    const teamNames = teamSeeds.map((team) => team.name);
    const [oldTeams, oldUsers] = await Promise.all([
      Team.find({ name: { $in: teamNames } }).select('_id'),
      User.find({ username: { $in: userSeeds.map((user) => user.username) } }).select('_id'),
    ]);
    const oldTeamIds = oldTeams.map((team) => team._id);
    const oldUserIds = oldUsers.map((user) => user._id);
    await Promise.all([
      Activity.deleteMany({ user: { $in: oldUserIds } }),
      Leaderboard.deleteMany({ user: { $in: oldUserIds } }),
      Team.updateMany({}, { $pull: { members: { $in: oldUserIds } } }),
      User.updateMany({ team: { $in: oldTeamIds } }, { $set: { team: null } }),
    ]);
    await Promise.all([
      User.deleteMany({ _id: { $in: oldUserIds } }),
      Team.deleteMany({ _id: { $in: oldTeamIds } }),
      Workout.deleteMany({ title: { $in: workoutSeeds.map((workout) => workout.title) } }),
    ]);

    const teams = await Team.insertMany(teamSeeds);
    const teamIds = new Map(teams.map((team) => [team.name, team._id]));

    const users = await User.insertMany(
      userSeeds.map(({ team, ...user }) => ({ ...user, team: teamIds.get(team) })),
    );
    const userIds = new Map(users.map((user) => [user.username, user._id]));

    for (const team of teams) {
      const members = userSeeds
        .filter((user) => user.team === team.name)
        .map((user) => userIds.get(user.username));
      await Team.findByIdAndUpdate(team._id, { $set: { members } });
    }

    await Activity.insertMany(
      activitySeeds.map(({ username, ...activity }) => ({
        ...activity,
        user: userIds.get(username),
        loggedAt: new Date(activity.loggedAt),
      })),
    );

    await Leaderboard.insertMany(
      userSeeds.map(({ username }) => ({
        user: userIds.get(username),
        points: activitySeeds
          .filter((activity) => activity.username === username)
          .reduce((total, activity) => total + activity.points, 0),
        period: 'all-time',
      })),
    );

    await Workout.insertMany(workoutSeeds);

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
