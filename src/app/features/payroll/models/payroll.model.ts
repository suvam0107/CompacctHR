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
}

export interface SalaryComponentItem {
  label: string;
  type: 'earning' | 'deduction';
  amount: number;
  isMonthly: boolean;
}

export interface SalaryStructureNested {
  employee: {
    id: number;
    name: string;
    employeeCode: string;
    department: string;
    designation: string;
  };
  ctc: number;
  components: SalaryComponentItem[];
  effectiveFrom: string;
}

export interface PayrollRunPayload {
  month: number;
  year: number;
  departmentId?: number | null;
}
