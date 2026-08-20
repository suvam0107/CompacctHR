// src/app/shared/components/status-badge/status-badge.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusCategory = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.html',
  styleUrls: ['./status-badge.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadge {
  @Input({ required: true }) status!: string;
  @Input() label?: string;

  get badgeText(): string {
    return this.label || this.status;
  }

  get category(): StatusCategory {
    const s = (this.status || '').toLowerCase().replace(/[\s_-]/g, '');

    switch (s) {
      case 'present':
      case 'approved':
      case 'active':
      case 'completed':
      case 'paid':
      case 'ontime':
        return 'success';

      case 'pending':
      case 'inreview':
      case 'halfday':
      case 'onleave':
      case 'late':
        return 'warning';

      case 'absent':
      case 'rejected':
      case 'inactive':
      case 'terminated':
      case 'failed':
      case 'unpaid':
        return 'danger';

      case 'notcheckedin':
      case 'draft':
      case 'processing':
      case 'info':
        return 'info';

      default:
        return 'neutral';
    }
  }
}
