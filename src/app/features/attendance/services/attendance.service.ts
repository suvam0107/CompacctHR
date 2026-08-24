// src/app/features/attendance/services/attendance.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, map, of, catchError } from 'rxjs';
import { APIService } from '../../../core/api/api.service';
import { SPC } from '../../../core/api/spc-registry';
import { LoggerService } from '../../../core/logging/logger.service';
import {
  AttendanceLogItem,
  AttendanceCalendarDay,
  RegularizationRequest,
  AttendanceFilterParams
} from '../models/attendance.model';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private api = inject(APIService);
  private logger = inject(LoggerService);

  private _logs = signal<AttendanceLogItem[]>([]);
  private _calendarDays = signal<AttendanceCalendarDay[]>([]);
  private _regularizationList = signal<RegularizationRequest[]>([]);
  private _isLoading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  readonly logs = this._logs.asReadonly();
  readonly calendarDays = this._calendarDays.asReadonly();
  readonly regularizationList = this._regularizationList.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  loadAttendanceLogs(params: AttendanceFilterParams = {}): Observable<AttendanceLogItem[]> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.callNonNested<AttendanceLogItem[]>(SPC.ATT_GET_LOG, params as Record<string, unknown>).pipe(
      tap(res => {
        this._isLoading.set(false);
        if (res.success && Array.isArray(res.data)) {
          this._logs.set(res.data);
        } else {
          this._error.set(res.message || 'Failed to load attendance logs');
        }
      }),
      map(res => (res.success && Array.isArray(res.data) ? res.data : [])),
      catchError(err => {
        this._isLoading.set(false);
        this._error.set(err.message || 'Failed to load attendance logs');
        this.logger.error('AttendanceService.loadAttendanceLogs failed', err);
        return of([]);
      })
    );
  }

  loadCalendar(month: number, year: number): Observable<AttendanceCalendarDay[]> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.callNonNested<AttendanceCalendarDay[]>(SPC.ATT_GET_CALENDAR, { month, year }).pipe(
      tap(res => {
        this._isLoading.set(false);
        if (res.success && Array.isArray(res.data)) {
          this._calendarDays.set(res.data);
        }
      }),
      map(res => (res.success && Array.isArray(res.data) ? res.data : [])),
      catchError(err => {
        this._isLoading.set(false);
        this.logger.error('AttendanceService.loadCalendar failed', err);
        return of([]);
      })
    );
  }

  loadRegularizationRequests(): Observable<RegularizationRequest[]> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.callNonNested<RegularizationRequest[]>(SPC.ATT_GET_REGULARIZATION_LIST).pipe(
      tap(res => {
        this._isLoading.set(false);
        if (res.success && Array.isArray(res.data)) {
          this._regularizationList.set(res.data);
        }
      }),
      map(res => (res.success && Array.isArray(res.data) ? res.data : [])),
      catchError(err => {
        this._isLoading.set(false);
        this.logger.error('AttendanceService.loadRegularizationRequests failed', err);
        return of([]);
      })
    );
  }

  submitRegularization(payload: Record<string, unknown>): Observable<boolean> {
    return this.api.callNonNested(SPC.ATT_SUBMIT_REGULARIZATION, payload).pipe(
      map(res => !!res.success)
    );
  }
}
