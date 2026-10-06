import { MongoClient, Db, ObjectId } from 'mongodb';
import { config } from '../config';
import { MeetingStatus } from '@keytake/shared';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export const connectToDatabase = async () => {
  if (cachedClient && cachedDb) {
    return cachedDb;
  }
  
  const client = new MongoClient(config.MONGODB_URI);
  await client.connect();
  
  cachedClient = client;
  cachedDb = client.db(); // Uses the default db in the URI
  return cachedDb;
};

export const getMeeting = async (meetingId: string, userId: string) => {
  const db = await connectToDatabase();
  return db.collection('meetings').findOne({ _id: new ObjectId(meetingId), userId });
};

export const updateMeetingStatus = async (meetingId: string, userId: string, status: MeetingStatus, ingestionJobId?: string) => {
  const db = await connectToDatabase();
  const updateDoc: any = { $set: { status, updatedAt: new Date() } };
  if (ingestionJobId) {
    updateDoc.$set.ingestionJobId = ingestionJobId;
  }
  await db.collection('meetings').updateOne(
    { _id: new ObjectId(meetingId), userId },
    updateDoc
  );
};
