// src/app/core/state/notification.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, map, of, catchError } from 'rxjs';
import { APIService } from '../api/api.service';
import { SPC } from '../api/spc-registry';
import { LoggerService } from '../logging/logger.service';

export interface NotificationCountData {
  unreadCount: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = inject(APIService);
  private logger = inject(LoggerService);

  private _unreadCount = signal<number>(0);
  readonly unreadCount = this._unreadCount.asReadonly();

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

  setUnreadCount(count: number): void {
    this._unreadCount.set(count);
  }

  decrement(): void {
    this._unreadCount.update(c => Math.max(0, c - 1));
  }
}
