import mongoose from 'mongoose';

const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/octofit_db';
const db = mongoose.connection;

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(connectionString);
  console.log('Connected to octofit_db');
}

db.on('error', (error) => console.error('MongoDB connection error:', error));

export default db;
