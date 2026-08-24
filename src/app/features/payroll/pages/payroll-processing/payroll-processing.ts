// src/app/features/payroll/pages/payroll-processing/payroll-processing.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { LookupCacheService } from '../../../../core/state/lookup-cache.service';
import { PayrollService } from '../../services/payroll.service';

@Component({
  selector: 'app-payroll-processing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, SelectModule, PageHeader],
  templateUrl: './payroll-processing.html',
  styleUrls: ['./payroll-processing.scss']
})
export class PayrollProcessing {
  private fb = inject(FormBuilder);
  private payrollService = inject(PayrollService);
  private lookupCache = inject(LookupCacheService);

  isProcessing = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  departmentOptions = this.lookupCache.departments;

  months = [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 }
  ];

  years = [
    { label: '2026', value: 2026 },
    { label: '2025', value: 2025 }
  ];

  payrollForm: FormGroup = this.fb.group({
    month: [8, Validators.required],
    year: [2026, Validators.required],
    departmentId: [null]
  });

  onRunPayroll(): void {
    this.isProcessing.set(true);
    this.isSuccess.set(false);
    this.errorMessage.set(null);

    this.payrollService.runPayroll(this.payrollForm.value).subscribe({
      next: success => {
        this.isProcessing.set(false);
        if (success) {
          this.isSuccess.set(true);
        } else {
          this.errorMessage.set('Payroll calculation completed with warnings.');
        }
      },
      error: err => {
        this.isProcessing.set(false);
        this.errorMessage.set(err?.message || 'Error occurred while executing payroll batch.');
      }
    });
  }
}
