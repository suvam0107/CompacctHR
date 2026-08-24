// src/app/features/attendance/models/attendance.model.ts

export interface AttendanceLogItem {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: string;
  status: 'Present' | 'Late' | 'HalfDay' | 'Absent' | 'OnLeave' | 'WeekOff' | 'Holiday';
  remarks?: string | null;
}

export interface AttendanceCalendarDay {
  date: string;
  status: 'Present' | 'Late' | 'HalfDay' | 'Absent' | 'OnLeave' | 'WeekOff' | 'Holiday';
  checkIn: string | null;
  checkOut: string | null;
  totalHours: string;
}

export interface RegularizationRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  originalStatus: string;
  requestedStatus: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}

export interface AttendanceFilterParams {
  startDate?: string;
  endDate?: string;
  employeeId?: number | null;
  status?: string | null;
  search?: string;
}
