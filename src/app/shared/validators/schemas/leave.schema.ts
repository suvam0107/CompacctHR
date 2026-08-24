import { z } from 'zod';

export const leaveApplySchema = z.object({
  leaveTypeId: z.number().int().positive('Select leave type'),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'From date must be in YYYY-MM-DD format'),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'To date must be in YYYY-MM-DD format'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Max 500 characters'),
}).refine(data => data.toDate >= data.fromDate, {
  message: 'To date must be on or after from date',
  path: ['toDate'],
});

export type LeaveApplySchema = z.infer<typeof leaveApplySchema>;
