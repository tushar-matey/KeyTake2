import { z } from 'zod';

export const apiErrorSchema = z.object({
  message: z.string(),
  error: z.string().optional(),
});

export function apiSuccessSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
  });
}
