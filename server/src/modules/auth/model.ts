import { Schema, model } from 'mongoose';

export interface IUser {
  cognitoSub: string;
  email: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  cognitoSub: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = model<IUser>('User', userSchema);
