// src/app/features/payroll/models/payroll.model.ts

export interface PayslipListItem {
  id: number;
  period: string;
  periodFrom: string;
  periodTo: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: 'Processed' | 'Pending' | 'Draft';
  processedAt: string;
  hrYearId?: number;
  hrYearName?: string;
}

export interface SalaryStructureNested {
  employee: {
    id: number;
    userHash?: string;
    name: string;
    empName: string;
    employeeCode: string;
    department: string;
    designation: string;
  };
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
  components: {
    label: string;
    type: 'earning' | 'deduction';
    amount: number;
    isMonthly: boolean;
  }[];
}

export interface PayrollRunPayload {
  month: number;
  year: number;
  hrYearId?: number;
  departmentId?: number | null;
}
