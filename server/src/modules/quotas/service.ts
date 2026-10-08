import { Quota } from './model';

const MAX_UPLOADS_PER_DAY = 100;

const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

export const checkUploadQuota = async (userId: string): Promise<boolean> => {
  const date = getTodayDateString();
  const quota = await Quota.findOne({ userId, date });
  
  if (!quota) {
    return true; // No quota record yet means 0 uploads
  }
  
  return quota.uploadCount < MAX_UPLOADS_PER_DAY;
};

export const incrementUploadQuota = async (userId: string): Promise<void> => {
  const date = getTodayDateString();
  
  await Quota.findOneAndUpdate(
    { userId, date },
    { $inc: { uploadCount: 1 } },
    { upsert: true, new: true }
  );
};

const MAX_CHAT_REQUESTS_PER_DAY = 50;

export const checkChatQuota = async (userId: string): Promise<boolean> => {
  const date = getTodayDateString();
  const quota = await Quota.findOne({ userId, date });
  
  if (!quota) return true;
  return quota.chatRequestCount < MAX_CHAT_REQUESTS_PER_DAY;
};

export const incrementChatQuota = async (userId: string): Promise<void> => {
  const date = getTodayDateString();
  await Quota.findOneAndUpdate(
    { userId, date },
    { $inc: { chatRequestCount: 1 } },
    { upsert: true, new: true }
  );
};
