// src/app/core/state/lookup-cache.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, map, of, catchError } from 'rxjs';
import { APIService } from '../api/api.service';
import { SPC } from '../api/spc-registry';
import { LoggerService } from '../logging/logger.service';

export interface Department {
  id: number;
  name: string;
  code?: string;
}

export interface Designation {
  id: number;
  name: string;
  departmentId?: number;
}

export interface LeaveType {
  id: number;
  code: string;
  name: string;
  defaultDays?: number;
}

export interface LookupData {
  departments: Department[];
  designations: Designation[];
  leaveTypes: LeaveType[];
}

@Injectable({ providedIn: 'root' })
export class LookupCacheService {
  private api = inject(APIService);
  private logger = inject(LoggerService);

  private _departments = signal<Department[]>([]);
  private _designations = signal<Designation[]>([]);
  private _leaveTypes = signal<LeaveType[]>([]);
  private _isLoaded = signal<boolean>(false);

  readonly departments = this._departments.asReadonly();
  readonly designations = this._designations.asReadonly();
  readonly leaveTypes = this._leaveTypes.asReadonly();
  readonly isLoaded = this._isLoaded.asReadonly();

  warmUp(): Observable<boolean> {
    if (this._isLoaded()) {
      return of(true);
    }

    return this.api.callNonNested<LookupData>(SPC.LOOKUP_GET_ALL).pipe(
      tap(res => {
        if (res.success && res.data) {
          this._departments.set(res.data.departments || []);
          this._designations.set(res.data.designations || []);
          this._leaveTypes.set(res.data.leaveTypes || []);
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
    this._isLoaded.set(false);
  }
}
