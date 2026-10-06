import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}
