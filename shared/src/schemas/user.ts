import { z } from 'zod';

export const userSchema = z.object({
  cognitoSub: z.string(),
  email: z.string().email(),
  createdAt: z.date(),
});

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const confirmSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6, 'Confirmation code must be at least 6 characters'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6, 'Reset code must be at least 6 characters'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type User = z.infer<typeof userSchema>;
