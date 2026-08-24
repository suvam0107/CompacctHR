// src/app/features/attendance/models/attendance.model.ts

export interface AttendanceLogItem {
  id: number;
  employeeId: number;
  employeeName: string;
  empCode: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: string;
  attenTypeId: number;
  attenType: string;
  shtDesc: string;
  attenTypeCalc: number;
  colourCode: string;
  status: string;
  dutyStartTime?: string | null;
  dutyEndTime?: string | null;
  workingHoursMins?: number | null;
  lateDeductionApplied?: boolean;
  otHours?: number | null;
  remarks?: string | null;
}

export interface AttendanceCalendarDay {
  date: string;
  attenTypeId: number;
  attenType: string;
  shtDesc: string;
  colourCode: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: string;
  isHoliday?: boolean;
  holidayPurpose?: string | null;
}

export interface RegularizationRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  originalAttenTypeId: number;
  originalAttenType: string;
  requestedAttenTypeId: number;
  requestedAttenType: string;
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
  attenTypeId?: number | null;
  status?: string | null;
  search?: string;
}
