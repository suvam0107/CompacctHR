// src/app/features/dashboard/components/announcements-widget/announcements-widget.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnnouncementItem } from '../../models/dashboard.model';
import { LoadingSkeleton } from '../../../../shared/components/loading-skeleton/loading-skeleton';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';

@Component({
  selector: 'app-announcements-widget',
  standalone: true,
  imports: [CommonModule, LoadingSkeleton, DateFormatPipe],
  templateUrl: './announcements-widget.html',
  styleUrls: ['./announcements-widget.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnnouncementsWidget {
  @Input() announcements: AnnouncementItem[] = [];
  @Input() isLoading: boolean = false;
}
