// src/app/features/dashboard/components/attendance-widget/attendance-widget.ts
import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { LoadingSkeleton } from '../../../../shared/components/loading-skeleton/loading-skeleton';
import { AttendanceSummary } from '../../models/dashboard.model';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-attendance-widget',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadge, LoadingSkeleton],
  templateUrl: './attendance-widget.html',
  styleUrls: ['./attendance-widget.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttendanceWidget {
  @Input() attendance: AttendanceSummary | null = null;
  @Input() isLoading: boolean = false;

  private messageService = inject(MessageService);

  handlePunch(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Web Punch',
      detail: 'Punch recorded successfully (Mock mode)',
      life: 3000
    });
  }
}
