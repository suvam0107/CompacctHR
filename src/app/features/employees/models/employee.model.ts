// src/app/features/employees/models/employee.model.ts

export interface EmployeeListItem {
  id: number;
  employeeCode: string;
  name: string;
  email: string;
  departmentId: number;
  departmentName: string;
  designationId: number;
  designationName: string;
  status: 'Active' | 'Inactive' | 'OnLeave';
  joinDate: string;
  avatarUrl?: string | null;
}

export interface EmployeePersonalInfo {
  id: number;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  avatarUrl?: string | null;
}

export interface EmployeeEmploymentInfo {
  departmentId: number;
  departmentName: string;
  designationId: number;
  designationName: string;
  joinDate: string;
  employmentType: string;
  reportingManagerId?: number | null;
  reportingManagerName?: string | null;
  status: 'Active' | 'Inactive' | 'OnLeave';
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
  ctc: number;
  basic: number;
  hra: number;
  allowances: number;
  effectiveFrom: string;
}

export interface EmployeeDetail360 {
  personal: EmployeePersonalInfo;
  employment: EmployeeEmploymentInfo;
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
