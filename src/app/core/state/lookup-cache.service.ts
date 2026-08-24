// src/app/core/state/lookup-cache.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, map, of, catchError } from 'rxjs';
import { APIService } from '../api/api.service';
import { SPC } from '../api/spc-registry';
import { LoggerService } from '../logging/logger.service';
import {
  LookupDepartment,
  LookupDesignation,
  LookupLeaveType,
  LookupAttendanceType,
  LookupHoliday,
  LookupHrYear,
  LookupLocation,
  LookupGrade,
  LookupPersonalArea,
  LookupAllResponse
} from '../../shared/models/lookup.model';

@Injectable({ providedIn: 'root' })
export class LookupCacheService {
  private api = inject(APIService);
  private logger = inject(LoggerService);

  private _departments = signal<LookupDepartment[]>([]);
  private _designations = signal<LookupDesignation[]>([]);
  private _leaveTypes = signal<LookupLeaveType[]>([]);
  private _attendanceTypes = signal<LookupAttendanceType[]>([]);
  private _holidays = signal<LookupHoliday[]>([]);
  private _hrYears = signal<LookupHrYear[]>([]);
  private _locations = signal<LookupLocation[]>([]);
  private _grades = signal<LookupGrade[]>([]);
  private _personalAreas = signal<LookupPersonalArea[]>([]);
  private _isLoaded = signal<boolean>(false);

  readonly departments = this._departments.asReadonly();
  readonly designations = this._designations.asReadonly();
  readonly leaveTypes = this._leaveTypes.asReadonly();
  readonly attendanceTypes = this._attendanceTypes.asReadonly();
  readonly holidays = this._holidays.asReadonly();
  readonly hrYears = this._hrYears.asReadonly();
  readonly locations = this._locations.asReadonly();
  readonly grades = this._grades.asReadonly();
  readonly personalAreas = this._personalAreas.asReadonly();
  readonly isLoaded = this._isLoaded.asReadonly();

  warmUp(): Observable<boolean> {
    if (this._isLoaded()) {
      return of(true);
    }

    return this.api.callNonNested<LookupAllResponse>(SPC.LOOKUP_GET_ALL).pipe(
      tap(res => {
        if (res.success && res.data) {
          this._departments.set(res.data.departments || []);
          this._designations.set(res.data.designations || []);
          this._leaveTypes.set(res.data.leaveTypes || []);
          this._attendanceTypes.set(res.data.attendanceTypes || []);
          this._holidays.set(res.data.holidays || []);
          this._hrYears.set(res.data.hrYears || []);
          this._locations.set(res.data.locations || []);
          this._grades.set(res.data.grades || []);
          this._personalAreas.set(res.data.personalAreas || []);
          this._isLoaded.set(true);
          this.logger.debug('LookupCacheService: Master data warmed up successfully');
        }
      }),
      map(res => !!(res.success && res.data)),
      catchError(err => {
        this.logger.error('LookupCacheService: Failed to warm up master data', err);
        return of(false);
      })
    );
  }

  clear(): void {
    this._departments.set([]);
    this._designations.set([]);
    this._leaveTypes.set([]);
    this._attendanceTypes.set([]);
    this._holidays.set([]);
    this._hrYears.set([]);
    this._locations.set([]);
    this._grades.set([]);
    this._personalAreas.set([]);
    this._isLoaded.set(false);
  }
}
