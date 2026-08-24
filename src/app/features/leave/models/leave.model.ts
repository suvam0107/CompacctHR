// src/app/features/leave/models/leave.model.ts

export interface LeaveBalanceItem {
  leaveTypeId: number;
  leaveTypeName: string;
  code: string;
  total: number;
  used: number;
  remaining: number;
}

export interface LeaveBalanceData {
  balances: LeaveBalanceItem[];
  totalRemaining: number;
  totalUsed: number;
}

export interface LeaveHistoryItem {
  id: number;
  leaveTypeId: number;
  leaveTypeName: string;
  leaveTypeCode: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  appliedAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  remarks?: string | null;
}

export interface LeaveApprovalItem {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveTypeId: number;
  leaveTypeName: string;
  leaveTypeCode: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedAt: string;
}

export interface LeaveApplyPayload {
  leaveTypeId: number;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  emergencyContact?: string;
}
