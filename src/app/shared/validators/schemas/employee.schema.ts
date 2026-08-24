import { z } from 'zod';

export const employeePersonalSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'Max 50 characters'),
  midName: z.string().max(50, 'Max 50 characters').optional().nullable(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Max 50 characters'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in YYYY-MM-DD format'),
  gender: z.enum(['Male', 'Female', 'Other'], { message: 'Select valid gender' }),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit mobile number'),
  phone: z.string().optional().nullable(),
  emergencyContact: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit emergency contact'),
  email: z.string().email('Invalid email').max(200).optional().nullable(),
  physicallyChallenged: z.enum(['Y', 'N'], { message: 'Must be Y or N' }),
  aadhaarNo: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits').optional().nullable(),
  panNo: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional().nullable(),
  epicNo: z.string().optional().nullable(),
  highestQualification: z.string().max(20).optional().nullable(),
  fatherMotherName: z.string().min(1, 'Father/Mother name is required').max(150),
  spouseName: z.string().max(150).optional().nullable(),
  state: z.string().max(25).optional().nullable(),
});

export const employeeEmploymentSchema = z.object({
  empCode: z.string().min(1, 'Employee code is required').max(20),
  department: z.string().min(1, 'Department is required').max(20),
  designation: z.string().min(1, 'Designation is required').max(20),
  grade: z.string().max(10).optional().nullable(),
  personalArea: z.string().min(1, 'Personal area is required').max(10),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  employementStatus: z.enum(['Active', 'Inactive', 'Resigned', 'On Leave'], { message: 'Select valid status' }),
  weeklyOff1: z.enum(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  weeklyOff2: z.enum(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).optional().nullable(),
  workingHoursMins: z.number().min(0).max(1440).optional().nullable(),
  eligibleForOt: z.enum(['Y', 'N']),
  lateDeduction: z.enum(['Y', 'N']),
  attendanceUsingBiometric: z.enum(['Y', 'N']),
  isHod: z.boolean().optional(),
});

export const employeeBankSchema = z.object({
  bankAccountNo: z.string().regex(/^\d{9,18}$/, 'Bank account number must be 9-18 digits'),
  bankName: z.string().min(1, 'Bank name is required').max(50),
  bankAcType: z.enum(['Savings', 'Current']),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format (e.g. SBIN0001234)'),
  branchName: z.string().min(1, 'Branch name is required').max(15),
  salaryPaidBy: z.string().min(1, 'Salary paid by is required'),
});

export const employeeStatutorySchema = z.object({
  esicNo: z.string().optional().nullable(),
  pfNo: z.string().optional().nullable(),
  uanNo: z.string().optional().nullable(),
  pTaxDeduct: z.enum(['Y', 'N']),
});

export type EmployeePersonalSchema = z.infer<typeof employeePersonalSchema>;
export type EmployeeEmploymentSchema = z.infer<typeof employeeEmploymentSchema>;
export type EmployeeBankSchema = z.infer<typeof employeeBankSchema>;
export type EmployeeStatutorySchema = z.infer<typeof employeeStatutorySchema>;
