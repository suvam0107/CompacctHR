// src/app/features/employees/services/employee.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, map, of, catchError } from 'rxjs';
import { APIService } from '../../../core/api/api.service';
import { SPC } from '../../../core/api/spc-registry';
import { LoggerService } from '../../../core/logging/logger.service';
import {
  EmployeeListItem,
  EmployeeDetail360,
  EmployeeFilterParams
} from '../models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private api = inject(APIService);
  private logger = inject(LoggerService);

  private _employees = signal<EmployeeListItem[]>([]);
  private _totalCount = signal<number>(0);
  private _isLoading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _selectedEmployee = signal<EmployeeDetail360 | null>(null);

  readonly employees = this._employees.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedEmployee = this._selectedEmployee.asReadonly();

  filters = signal<EmployeeFilterParams>({
    departmentId: null,
    designationId: null,
    status: null,
    search: '',
    page: 1,
    pageSize: 10
  });

  loadEmployees(params: Partial<EmployeeFilterParams> = {}): Observable<EmployeeListItem[]> {
    this._isLoading.set(true);
    this._error.set(null);

    const mergedParams = { ...this.filters(), ...params };
    this.filters.set(mergedParams);

    return this.api.callNonNested<EmployeeListItem[]>(SPC.EMP_GET_LIST, mergedParams as Record<string, unknown>).pipe(
      tap(res => {
        this._isLoading.set(false);
        if (res.success && Array.isArray(res.data)) {
          this._employees.set(res.data);
          this._totalCount.set(res.totalCount || res.data.length);
        } else {
          this._error.set(res.message || 'Failed to load employee directory');
        }
      }),
      map(res => (res.success && Array.isArray(res.data) ? res.data : [])),
      catchError(err => {
        this._isLoading.set(false);
        this._error.set(err.message || 'Failed to load employees');
        this.logger.error('EmployeeService.loadEmployees failed', err);
        return of([]);
      })
    );
  }

  getEmployeeDetail(id: number): Observable<EmployeeDetail360 | null> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.callNested<EmployeeDetail360>(SPC.EMP_GET_DETAIL, { id }).pipe(
      tap(res => {
        this._isLoading.set(false);
        if (res.success && res.data) {
          this._selectedEmployee.set(res.data);
        } else {
          this._error.set(res.message || 'Failed to load employee details');
        }
      }),
      map(res => (res.success ? res.data : null)),
      catchError(err => {
        this._isLoading.set(false);
        this._error.set(err.message || 'Failed to load employee details');
        this.logger.error('EmployeeService.getEmployeeDetail failed', err);
        return of(null);
      })
    );
  }

  createEmployee(payload: Record<string, unknown>): Observable<boolean> {
    return this.api.callNonNested(SPC.EMP_CREATE, payload).pipe(
      map(res => !!res.success)
    );
  }

  updateEmployee(payload: Record<string, unknown>): Observable<boolean> {
    return this.api.callNonNested(SPC.EMP_UPDATE, payload).pipe(
      map(res => !!res.success)
    );
  }
}
