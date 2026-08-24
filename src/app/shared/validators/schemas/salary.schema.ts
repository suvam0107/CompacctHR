import { z } from 'zod';

export const salaryStructureSchema = z.object({
  empId: z.number().int().positive('Select employee'),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Effective from date must be YYYY-MM-DD'),
  basicSalary: z.number().min(0, 'Basic salary must be non-negative'),
  hra: z.number().min(0, 'HRA must be non-negative'),
  medicalAllowance: z.number().min(0, 'Medical allowance must be non-negative'),
  specialAllowance: z.number().min(0, 'Special allowance must be non-negative'),
  educationalAllowance: z.number().min(0, 'Educational allowance must be non-negative'),
  cityCompensationAllowance: z.number().min(0, 'City compensation allowance must be non-negative'),
  encashment: z.number().min(0, 'Encashment must be non-negative'),
});

export type SalaryStructureSchema = z.infer<typeof salaryStructureSchema>;
