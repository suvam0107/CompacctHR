// src/app/features/leave/pages/leave-apply/leave-apply.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { LeaveBalanceCard } from '../../components/leave-balance-card/leave-balance-card';
import { LookupCacheService } from '../../../../core/state/lookup-cache.service';
import { LeaveService } from '../../services/leave.service';

@Component({
  selector: 'app-leave-apply',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    PageHeader,
    LeaveBalanceCard
  ],
  templateUrl: './leave-apply.html',
  styleUrls: ['./leave-apply.scss']
})
export class LeaveApply implements OnInit {
  protected leaveService = inject(LeaveService);
  private lookupCache = inject(LookupCacheService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  leaveTypeOptions = this.lookupCache.leaveTypes;

  leaveForm: FormGroup = this.fb.group({
    leaveTypeId: [1, Validators.required],
    fromDate: [new Date(), Validators.required],
    toDate: [new Date(), Validators.required],
    reason: ['', [Validators.required, Validators.minLength(5)]],
    emergencyContact: ['']
  });

  ngOnInit(): void {
    this.leaveService.loadBalances().subscribe();
  }

  onSubmit(): void {
    if (this.leaveForm.invalid) {
      this.leaveForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const val = this.leaveForm.value;
    const from = new Date(val.fromDate);
    const to = new Date(val.toDate);
    const diffTime = Math.abs(to.getTime() - from.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    this.leaveService.applyLeave({
      leaveTypeId: val.leaveTypeId,
      fromDate: val.fromDate.toISOString().slice(0, 10),
      toDate: val.toDate.toISOString().slice(0, 10),
      days,
      reason: val.reason,
      emergencyContact: val.emergencyContact
    }).subscribe({
      next: success => {
        this.isSubmitting.set(false);
        if (success) {
          this.router.navigate(['/leave/history']);
        } else {
          this.errorMessage.set('Failed to apply for leave. Please verify your balance.');
        }
      },
      error: err => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.message || 'Error occurred while submitting request.');
      }
    });
  }
}
