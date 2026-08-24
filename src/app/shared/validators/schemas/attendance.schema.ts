import { z } from 'zod';

export const regularizationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  attenTypeId: z.number().int().positive('Select attendance type'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Max 500 characters'),
});

export type RegularizationSchema = z.infer<typeof regularizationSchema>;
