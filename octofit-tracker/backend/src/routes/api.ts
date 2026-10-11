import { Router } from 'express';
import { Types } from 'mongoose';
import { Activity } from '../models/activity.js';
import { LeaderboardEntry } from '../models/leaderboard.js';
import { Team } from '../models/team.js';
import { User } from '../models/user.js';
import { Workout } from '../models/workout.js';

const router = Router();

async function refreshLeaderboard(userId: string): Promise<void> {
  const [totals] = await Activity.aggregate([
    { $match: { user: new Types.ObjectId(userId) } },
    { $group: { _id: null, points: { $sum: '$points' } } },
  ]);

  await LeaderboardEntry.findOneAndUpdate(
    { user: userId },
    { $set: { points: totals?.points ?? 0, period: 'all-time' } },
    { upsert: true, setDefaultsOnInsert: true },
  );
}

router.get('/users', async (_request, response) => {
  response.json(await User.find().populate('team', 'name'));
});

router.post('/users', async (request, response) => {
  response.status(201).json(await User.create(request.body));
});

router.get('/users/:id', async (request, response) => {
  const user = await User.findById(request.params.id).populate('team', 'name');
  if (!user) {
    response.status(404).json({ error: 'User not found' });
    return;
  }
  response.json(user);
});

router.patch('/users/:id', async (request, response) => {
  const user = await User.findByIdAndUpdate(request.params.id, request.body, {
    new: true,
    runValidators: true,
  }).populate('team', 'name');
  if (!user) {
    response.status(404).json({ error: 'User not found' });
    return;
  }
  response.json(user);
});

router.delete('/users/:id', async (request, response) => {
  const user = await User.findByIdAndDelete(request.params.id);
  if (!user) {
    response.status(404).json({ error: 'User not found' });
    return;
  }
  await Promise.all([
    Activity.deleteMany({ user: user._id }),
    LeaderboardEntry.deleteOne({ user: user._id }),
    Team.updateMany({ members: user._id }, { $pull: { members: user._id } }),
  ]);
  response.status(204).end();
});

router.get('/teams', async (_request, response) => {
  response.json(await Team.find().populate('members', 'username displayName'));
});

router.post('/teams', async (request, response) => {
  response.status(201).json(await Team.create(request.body));
});

router.get('/teams/:id', async (request, response) => {
  const team = await Team.findById(request.params.id).populate('members', 'username displayName');
  if (!team) {
    response.status(404).json({ error: 'Team not found' });
    return;
  }
  response.json(team);
});

router.patch('/teams/:id', async (request, response) => {
  const team = await Team.findByIdAndUpdate(request.params.id, request.body, {
    new: true,
    runValidators: true,
  }).populate('members', 'username displayName');
  if (!team) {
    response.status(404).json({ error: 'Team not found' });
    return;
  }
  response.json(team);
});

router.delete('/teams/:id', async (request, response) => {
  const team = await Team.findByIdAndDelete(request.params.id);
  if (!team) {
    response.status(404).json({ error: 'Team not found' });
    return;
  }
  response.status(204).end();
});

router.get('/activities', async (request, response) => {
  const activities = Activity.find();
  if (typeof request.query.user === 'string') {
    activities.where('user').equals(request.query.user);
  }
  response.json(await activities.populate('user', 'username displayName').sort({ loggedAt: -1 }));
});

router.post('/activities', async (request, response) => {
  const activity = await Activity.create(request.body);
  await refreshLeaderboard(activity.user.toString());
  response.status(201).json(activity);
});

router.get('/activities/:id', async (request, response) => {
  const activity = await Activity.findById(request.params.id).populate('user', 'username displayName');
  if (!activity) {
    response.status(404).json({ error: 'Activity not found' });
    return;
  }
  response.json(activity);
});

router.patch('/activities/:id', async (request, response) => {
  const previousActivity = await Activity.findById(request.params.id);
  if (!previousActivity) {
    response.status(404).json({ error: 'Activity not found' });
    return;
  }

  const activity = await Activity.findByIdAndUpdate(request.params.id, request.body, {
    new: true,
    runValidators: true,
  });
  if (!activity) {
    response.status(404).json({ error: 'Activity not found' });
    return;
  }
  const previousUserId = previousActivity.user.toString();
  const currentUserId = activity.user.toString();
  await refreshLeaderboard(previousUserId);
  if (currentUserId !== previousUserId) {
    await refreshLeaderboard(currentUserId);
  }
  response.json(await activity.populate('user', 'username displayName'));
});

router.delete('/activities/:id', async (request, response) => {
  const activity = await Activity.findByIdAndDelete(request.params.id);
  if (!activity) {
    response.status(404).json({ error: 'Activity not found' });
    return;
  }
  await refreshLeaderboard(activity.user.toString());
  response.status(204).end();
});

router.get('/leaderboard', async (request, response) => {
  const entriesQuery = LeaderboardEntry.find();
  if (typeof request.query.period === 'string') {
    entriesQuery.where('period').equals(request.query.period);
  }
  const entries = await entriesQuery.populate('user', 'username displayName').sort({ points: -1, updatedAt: 1 });
  response.json(entries.map((entry, index) => ({ ...entry.toObject(), rank: index + 1 })));
});

router.get('/workouts', async (request, response) => {
  const workouts = Workout.find();
  if (typeof request.query.difficulty === 'string') {
    workouts.where('difficulty').equals(request.query.difficulty);
  }
  response.json(await workouts.sort({ title: 1 }));
});

router.post('/workouts', async (request, response) => {
  response.status(201).json(await Workout.create(request.body));
});

router.get('/workouts/:id', async (request, response) => {
  const workout = await Workout.findById(request.params.id);
  if (!workout) {
    response.status(404).json({ error: 'Workout not found' });
    return;
  }
  response.json(workout);
});

router.patch('/workouts/:id', async (request, response) => {
  const workout = await Workout.findByIdAndUpdate(request.params.id, request.body, {
    new: true,
    runValidators: true,
  });
  if (!workout) {
    response.status(404).json({ error: 'Workout not found' });
    return;
  }
  response.json(workout);
});

router.delete('/workouts/:id', async (request, response) => {
  const workout = await Workout.findByIdAndDelete(request.params.id);
  if (!workout) {
    response.status(404).json({ error: 'Workout not found' });
    return;
  }
  response.status(204).end();
});

export default router;
