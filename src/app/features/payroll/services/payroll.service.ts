// src/app/features/payroll/services/payroll.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, map, of, catchError } from 'rxjs';
import { APIService } from '../../../core/api/api.service';
import { SPC } from '../../../core/api/spc-registry';
import { LoggerService } from '../../../core/logging/logger.service';
import {
  PayslipListItem,
  SalaryStructureNested,
  PayrollRunPayload
} from '../models/payroll.model';

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private api = inject(APIService);
  private logger = inject(LoggerService);

  private _payslips = signal<PayslipListItem[]>([]);
  private _salaryStructure = signal<SalaryStructureNested | null>(null);
  private _isLoading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  readonly payslips = this._payslips.asReadonly();
  readonly salaryStructure = this._salaryStructure.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  loadPayslips(): Observable<PayslipListItem[]> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.callNonNested<PayslipListItem[]>(SPC.PAY_GET_PAYSLIPS).pipe(
      tap(res => {
        this._isLoading.set(false);
        if (res.success && Array.isArray(res.data)) {
          this._payslips.set(res.data);
        }
      }),
      map(res => (res.success && Array.isArray(res.data) ? res.data : [])),
      catchError(err => {
        this._isLoading.set(false);
        this._error.set(err.message || 'Failed to load payslips');
        this.logger.error('PayrollService.loadPayslips failed', err);
        return of([]);
      })
    );
  }

  loadSalaryStructure(): Observable<SalaryStructureNested | null> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.callNested<SalaryStructureNested>(SPC.PAY_GET_SALARY_STRUCTURE).pipe(
      tap(res => {
        this._isLoading.set(false);
        if (res.success && res.data) {
          this._salaryStructure.set(res.data);
        }
      }),
      map(res => (res.success ? res.data : null)),
      catchError(err => {
        this._isLoading.set(false);
        this.logger.error('PayrollService.loadSalaryStructure failed', err);
        return of(null);
      })
    );
  }

  runPayroll(payload: PayrollRunPayload): Observable<boolean> {
    return this.api.callNonNested(SPC.PAY_RUN_PAYROLL, payload as unknown as Record<string, unknown>).pipe(
      map(res => !!res.success)
    );
  }
}
