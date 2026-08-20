// src/app/features/dashboard/models/leave.model.ts

export interface LeaveBalanceItem {
  leaveType: string;
  code: string;
  total: number;
  used: number;
  remaining: number;
  color?: string;
}

export interface LeaveBalanceData {
  balances: LeaveBalanceItem[];
  pendingApprovalsCount?: number;
}
