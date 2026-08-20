// src/app/features/dashboard/models/dashboard.model.ts

export interface StatItem {
  value: number;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
}

export interface AttendanceSummary {
  checkInTime: string | null;
  checkOutTime: string | null;
  totalHours: string;
  status: 'Present' | 'Late' | 'HalfDay' | 'Absent' | 'NotCheckedIn';
  lastActivity?: string;
  expectedHours?: string;
}

export interface AnnouncementItem {
  id: number;
  title: string;
  category: string;
  date: string;
  isImportant: boolean;
  author: string;
}

export interface DashboardSummary {
  stats: {
    totalEmployees: StatItem;
    presentToday: StatItem & { percentage?: number };
    onLeaveToday: StatItem;
    openPositions: StatItem;
  };
  todayAttendance: AttendanceSummary;
  announcements: AnnouncementItem[];
}
