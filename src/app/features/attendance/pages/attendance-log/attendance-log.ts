// src/app/features/attendance/pages/attendance-log/attendance-log.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { DataTable, DataTableColumn } from '../../../../shared/components/data-table/data-table';
import { DateRangePicker, DateRangeValue } from '../../../../shared/components/date-range-picker/date-range-picker';
import { AttendanceService } from '../../services/attendance.service';

@Component({
  selector: 'app-attendance-log',
  standalone: true,
  imports: [CommonModule, PageHeader, DataTable, DateRangePicker],
  templateUrl: './attendance-log.html',
  styleUrls: ['./attendance-log.scss']
})
export class AttendanceLog implements OnInit {
  protected attendanceService = inject(AttendanceService);

  columns: DataTableColumn[] = [
    { field: 'employeeName', header: 'Employee', sortable: true },
    { field: 'date', header: 'Date', width: '130px', type: 'date', sortable: true },
    { field: 'checkIn', header: 'Check In', width: '120px' },
    { field: 'checkOut', header: 'Check Out', width: '120px' },
    { field: 'totalHours', header: 'Total Hours', width: '120px' },
    { field: 'status', header: 'Status', width: '120px', type: 'status', align: 'center', sortable: true },
    { field: 'remarks', header: 'Remarks' }
  ];

  ngOnInit(): void {
    this.attendanceService.loadAttendanceLogs().subscribe();
  }

  onRangeChange(range: DateRangeValue): void {
    if (range.startDate) {
      const startStr = this.formatDate(range.startDate);
      const endStr = range.endDate ? this.formatDate(range.endDate) : startStr;
      this.attendanceService.loadAttendanceLogs({
        startDate: startStr,
        endDate: endStr
      }).subscribe();
    }
  }

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
