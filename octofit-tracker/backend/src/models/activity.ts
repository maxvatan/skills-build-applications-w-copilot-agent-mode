import { Schema, model } from 'mongoose';

const activitySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    activityType: {
      type: String,
      required: true,
      enum: ['running', 'walking', 'cycling', 'swimming', 'strength', 'other'],
    },
    durationMinutes: { type: Number, required: true, min: 1 },
    distanceKm: { type: Number, default: 0, min: 0 },
    calories: { type: Number, default: 0, min: 0 },
    points: { type: Number, default: 0, min: 0 },
    loggedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

export const Activity = model('Activity', activitySchema);
