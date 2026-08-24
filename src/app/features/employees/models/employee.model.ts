// src/app/features/employees/models/employee.model.ts

export type EmployementStatus = 'Active' | 'Inactive' | 'Resigned' | 'On Leave';

export interface EmployeeListItem {
  id: number;
  userHash?: string;
  empCode: string;
  employeeCode?: string;
  firstName: string;
  midName?: string | null;
  lastName: string;
  empName: string;
  name?: string;
  email: string;
  mobileNumber: string;
  department: string;
  departmentId: number;
  departmentName: string;
  designation: string;
  designationId: number;
  designationName: string;
  grade?: string | null;
  personalArea: string;
  location: string;
  state?: string | null;
  isHod: boolean;
  employementStatus: EmployementStatus;
  status: EmployementStatus;
  joinDate: string;
  avatarUrl?: string | null;
}

export interface EmployeePersonalInfo {
  id: number;
  empCode: string;
  employeeCode?: string;
  firstName: string;
  midName?: string | null;
  lastName: string;
  empName: string;
  name?: string;
  gender?: string;
  address?: string;
  dob: string;
  fatherMotherName: string;
  spouseName?: string | null;
  phone?: string | null;
  mobileNumber: string;
  emergencyContact: string;
  email: string;
  physicallyChallenged: 'Y' | 'N';
  epicNo?: string | null;
  aadhaarNo?: string | null;
  panNo?: string | null;
  highestQualification?: string | null;
  state?: string | null;
  avatarUrl?: string | null;
}

export interface EmployeeEmploymentInfo {
  workingCompany: string;
  currentLocation: string;
  department: string;
  departmentId: number;
  departmentName: string;
  designation: string;
  designationId: number;
  designationName: string;
  grade?: string | null;
  personalArea: string;
  isHod: boolean;
  joiningDate: string;
  joinDate?: string;
  employementStatus: EmployementStatus;
  employmentType?: string;
  status: EmployementStatus;
  reportingManagerId?: number | null;
  reportingManagerName?: string | null;
  resignOn?: string | null;
  releaseOn?: string | null;
  weeklyOff1: string;
  weeklyOff2?: string | null;
  dutyStartTime?: string | null;
  dutyEndTime?: string | null;
  workingHoursMins?: number | null;
  eligibleForOt: 'Y' | 'N';
  lateDeduction: 'Y' | 'N';
  attendanceUsingBiometric: 'Y' | 'N';
  approval1?: string | null;
  approval2?: string | null;
  remarks?: string | null;
}

export interface EmployeeBankInfo {
  salaryPaidBy: string;
  bankAccountNo: string;
  bankName: string;
  bankAcType: 'Savings' | 'Current';
  ifscCode: string;
  branchName: string;
}

export interface EmployeeStatutoryInfo {
  esicNo?: string | null;
  pfNo?: string | null;
  uanNo?: string | null;
  pTaxDeduct: 'Y' | 'N';
}

export interface EmployeeDocument {
  id: number;
  type: string;
  fileName: string;
  uploadedAt: string;
  url: string;
}

export interface EmployeeLeaveBalance {
  leaveTypeId: number;
  leaveTypeName: string;
  code: string;
  total: number;
  used: number;
  remaining: number;
}

export interface EmployeeSalaryInfo {
  txnId: number;
  effectiveFrom: string;
  basicSalary: number;
  hra: number;
  medicalAllowance: number;
  specialAllowance: number;
  educationalAllowance: number;
  cityCompensationAllowance: number;
  encashment: number;
  ctc: number;
}

export interface EmployeeDetail360 {
  personal: EmployeePersonalInfo;
  employment: EmployeeEmploymentInfo;
  bankInfo: EmployeeBankInfo;
  statutoryInfo: EmployeeStatutoryInfo;
  documents: EmployeeDocument[];
  leaveBalances: EmployeeLeaveBalance[];
  salaryInfo: EmployeeSalaryInfo;
}

export interface EmployeeFilterParams {
  departmentId?: number | null;
  designationId?: number | null;
  status?: string | null;
  search?: string;
  page?: number;
  pageSize?: number;
}
