// src/app/features/dashboard/services/dashboard.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, map, of, catchError } from 'rxjs';
import { APIService } from '../../../core/api/api.service';
import { SPC } from '../../../core/api/spc-registry';
import { LoggerService } from '../../../core/logging/logger.service';
import { DashboardSummary } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = inject(APIService);
  private logger = inject(LoggerService);

  private _summary = signal<DashboardSummary | null>(null);
  private _isLoading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  readonly summary = this._summary.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  prefetchSummary(): Observable<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.callNonNested<DashboardSummary>(SPC.DASH_GET_SUMMARY).pipe(
      tap(res => {
        this._isLoading.set(false);
        if (res.success && res.data) {
          this._summary.set(res.data);
          this.logger.debug('DashboardService: Prefetched dashboard summary');
        } else {
          this._error.set(res.message || 'Failed to load dashboard summary');
        }
      }),
      map(res => !!(res.success && res.data)),
      catchError(err => {
        this._isLoading.set(false);
        this._error.set(err.message || 'Failed to load dashboard summary');
        this.logger.error('DashboardService: Failed to prefetch dashboard summary', err);
        return of(false);
      })
    );
  }

  refresh(): Observable<boolean> {
    return this.prefetchSummary();
  }
}
