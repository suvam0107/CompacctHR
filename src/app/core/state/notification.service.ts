// src/app/core/state/notification.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, map, of, catchError } from 'rxjs';
import { APIService } from '../api/api.service';
import { SPC } from '../api/spc-registry';
import { LoggerService } from '../logging/logger.service';

export interface NotificationCountData {
  unreadCount: number;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type?: string;
  severity?: 'info' | 'warning' | 'success' | 'danger';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = inject(APIService);
  private logger = inject(LoggerService);

  private _unreadCount = signal<number>(0);
  private _notifications = signal<NotificationItem[]>([]);
  readonly isLoading = signal<boolean>(false);

  readonly unreadCount = this._unreadCount.asReadonly();
  readonly notifications = this._notifications.asReadonly();

  prefetchCount(): Observable<boolean> {
    return this.api.callNonNested<NotificationCountData>(SPC.NOTIF_GET_COUNT).pipe(
      tap(res => {
        if (res.success && res.data) {
          this._unreadCount.set(res.data.unreadCount ?? 0);
          this.logger.debug('NotificationService: Unread count loaded', res.data.unreadCount);
        }
      }),
      map(res => !!(res.success && res.data)),
      catchError(err => {
        this.logger.error('NotificationService: Failed to fetch notification count', err);
        return of(false);
      })
    );
  }

  loadNotifications(): Observable<NotificationItem[]> {
    this.isLoading.set(true);
    return this.api.callNonNested<NotificationItem[]>(SPC.NOTIF_GET_LIST).pipe(
      tap(res => {
        this.isLoading.set(false);
        if (res.success && Array.isArray(res.data)) {
          this._notifications.set(res.data);
          const unread = res.data.filter(item => !item.read).length;
          this._unreadCount.set(unread);
        }
      }),
      map(res => (res.success && Array.isArray(res.data) ? res.data : [])),
      catchError(err => {
        this.isLoading.set(false);
        this.logger.error('NotificationService: Failed to load notifications', err);
        return of([]);
      })
    );
  }

  markAsRead(id: number): void {
    this._notifications.update(items =>
      items.map(item => (item.id === id ? { ...item, read: true } : item))
    );
    const unread = this._notifications().filter(item => !item.read).length;
    this._unreadCount.set(unread);
  }

  markAllAsRead(): void {
    this._notifications.update(items =>
      items.map(item => ({ ...item, read: true }))
    );
    this._unreadCount.set(0);
  }

  setUnreadCount(count: number): void {
    this._unreadCount.set(count);
  }

  decrement(): void {
    this._unreadCount.update(c => Math.max(0, c - 1));
  }
}
