import { z } from 'zod';

export const profileUpdateSchema = z.object({
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable(),
  emergencyContact: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit mobile number'),
});

export type ProfileUpdateSchema = z.infer<typeof profileUpdateSchema>;
