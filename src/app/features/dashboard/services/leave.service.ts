// src/app/features/dashboard/services/leave.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, map, of, catchError } from 'rxjs';
import { APIService } from '../../../core/api/api.service';
import { SPC } from '../../../core/api/spc-registry';
import { LoggerService } from '../../../core/logging/logger.service';
import { LeaveBalanceData, LeaveBalanceItem } from '../models/leave.model';

@Injectable({ providedIn: 'root' })
export class LeaveService {
  private api = inject(APIService);
  private logger = inject(LoggerService);

  private _balanceData = signal<LeaveBalanceData | null>(null);
  private _isLoading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  readonly balanceData = this._balanceData.asReadonly();
  readonly balances = signal<LeaveBalanceItem[]>([]);
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  prefetchBalance(): Observable<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.callNonNested<LeaveBalanceData>(SPC.LEAVE_GET_BALANCE).pipe(
      tap(res => {
        this._isLoading.set(false);
        if (res.success && res.data) {
          this._balanceData.set(res.data);
          this.balances.set(res.data.balances || []);
          this.logger.debug('LeaveService: Prefetched leave balances');
        } else {
          this._error.set(res.message || 'Failed to load leave balances');
        }
      }),
      map(res => !!(res.success && res.data)),
      catchError(err => {
        this._isLoading.set(false);
        this._error.set(err.message || 'Failed to load leave balances');
        this.logger.error('LeaveService: Failed to prefetch leave balance', err);
        return of(false);
      })
    );
  }

  refresh(): Observable<boolean> {
    return this.prefetchBalance();
  }
}
