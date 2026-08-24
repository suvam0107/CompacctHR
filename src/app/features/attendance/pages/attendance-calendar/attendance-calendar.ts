// src/app/features/attendance/pages/attendance-calendar/attendance-calendar.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { AttendanceService } from '../../services/attendance.service';

@Component({
  selector: 'app-attendance-calendar',
  standalone: true,
  imports: [CommonModule, ButtonModule, PageHeader, StatusBadge],
  templateUrl: './attendance-calendar.html',
  styleUrls: ['./attendance-calendar.scss']
})
export class AttendanceCalendar implements OnInit {
  protected attendanceService = inject(AttendanceService);

  currentMonth = signal<number>(8); // August
  currentYear = signal<number>(2026);

  monthName = computed(() => {
    const d = new Date(this.currentYear(), this.currentMonth() - 1, 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  });

  presentDaysCount = computed(() => {
    return this.attendanceService.calendarDays().filter(d => d.status === 'Present').length;
  });

  lateDaysCount = computed(() => {
    return this.attendanceService.calendarDays().filter(d => d.status === 'Late').length;
  });

  leaveDaysCount = computed(() => {
    return this.attendanceService.calendarDays().filter(d => d.status === 'OnLeave' || d.status === 'HalfDay').length;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.attendanceService.loadCalendar(this.currentMonth(), this.currentYear()).subscribe();
  }

  prevMonth(): void {
    if (this.currentMonth() === 1) {
      this.currentMonth.set(12);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
    this.loadData();
  }

  nextMonth(): void {
    if (this.currentMonth() === 12) {
      this.currentMonth.set(1);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
    this.loadData();
  }
}
