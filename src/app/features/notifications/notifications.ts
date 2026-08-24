// src/app/features/notifications/notifications.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { DateFormatPipe } from '../../shared/pipes/date-format.pipe';
import { NotificationService, NotificationItem } from '../../core/state/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    PageHeader,
    LoadingSkeleton,
    EmptyState,
    DateFormatPipe
  ],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss']
})
export class Notifications implements OnInit {
  protected notifService = inject(NotificationService);

  activeFilter = signal<'all' | 'unread' | 'important'>('all');

  filteredNotifications = computed(() => {
    const list = this.notifService.notifications();
    const filterType = this.activeFilter();

    if (filterType === 'unread') {
      return list.filter(item => !item.read);
    }
    if (filterType === 'important') {
      return list.filter(item => item.severity === 'warning' || item.severity === 'danger');
    }
    return list;
  });

  ngOnInit(): void {
    this.notifService.loadNotifications().subscribe();
  }

  setFilter(filter: 'all' | 'unread' | 'important'): void {
    this.activeFilter.set(filter);
  }

  markAsRead(item: NotificationItem): void {
    this.notifService.markAsRead(item.id);
  }

  markAllAsRead(): void {
    this.notifService.markAllAsRead();
  }
}
