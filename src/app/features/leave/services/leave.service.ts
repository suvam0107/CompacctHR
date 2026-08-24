// src/app/features/leave/services/leave.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, map, of, catchError } from 'rxjs';
import { APIService } from '../../../core/api/api.service';
import { SPC } from '../../../core/api/spc-registry';
import { LoggerService } from '../../../core/logging/logger.service';
import {
  LeaveBalanceData,
  LeaveBalanceItem,
  LeaveHistoryItem,
  LeaveApprovalItem,
  LeaveApplyPayload
} from '../models/leave.model';

@Injectable({ providedIn: 'root' })
export class LeaveService {
  private api = inject(APIService);
  private logger = inject(LoggerService);

  private _balanceData = signal<LeaveBalanceData | null>(null);
  private _balances = signal<LeaveBalanceItem[]>([]);
  private _history = signal<LeaveHistoryItem[]>([]);
  private _approvals = signal<LeaveApprovalItem[]>([]);
  private _isLoading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  readonly balanceData = this._balanceData.asReadonly();
  readonly balances = this._balances.asReadonly();
  readonly history = this._history.asReadonly();
  readonly approvals = this._approvals.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  loadBalances(): Observable<LeaveBalanceData | null> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.callNonNested<LeaveBalanceData>(SPC.LEAVE_GET_BALANCE).pipe(
      tap(res => {
        this._isLoading.set(false);
        if (res.success && res.data) {
          this._balanceData.set(res.data);
          this._balances.set(res.data.balances || []);
        }
      }),
      map(res => (res.success ? res.data : null)),
      catchError(err => {
        this._isLoading.set(false);
        this._error.set(err.message || 'Failed to load leave balances');
        this.logger.error('LeaveService.loadBalances failed', err);
        return of(null);
      })
    );
  }

  loadHistory(): Observable<LeaveHistoryItem[]> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.callNonNested<LeaveHistoryItem[]>(SPC.LEAVE_GET_HISTORY).pipe(
      tap(res => {
        this._isLoading.set(false);
        if (res.success && Array.isArray(res.data)) {
          this._history.set(res.data);
        }
      }),
      map(res => (res.success && Array.isArray(res.data) ? res.data : [])),
      catchError(err => {
        this._isLoading.set(false);
        this.logger.error('LeaveService.loadHistory failed', err);
        return of([]);
      })
    );
  }

  loadApprovals(): Observable<LeaveApprovalItem[]> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.callNonNested<LeaveApprovalItem[]>(SPC.LEAVE_GET_APPROVALS).pipe(
      tap(res => {
        this._isLoading.set(false);
        if (res.success && Array.isArray(res.data)) {
          this._approvals.set(res.data);
        }
      }),
      map(res => (res.success && Array.isArray(res.data) ? res.data : [])),
      catchError(err => {
        this._isLoading.set(false);
        this.logger.error('LeaveService.loadApprovals failed', err);
        return of([]);
      })
    );
  }

  applyLeave(payload: LeaveApplyPayload): Observable<boolean> {
    return this.api.callNonNested(SPC.LEAVE_APPLY, payload as unknown as Record<string, unknown>).pipe(
      map(res => !!res.success)
    );
  }

  approveLeave(id: number, remarks?: string): Observable<boolean> {
    return this.api.callNonNested(SPC.LEAVE_APPROVE, { id, remarks }).pipe(
      map(res => !!res.success)
    );
  }

  rejectLeave(id: number, remarks?: string): Observable<boolean> {
    return this.api.callNonNested(SPC.LEAVE_REJECT, { id, remarks }).pipe(
      map(res => !!res.success)
    );
  }
}
