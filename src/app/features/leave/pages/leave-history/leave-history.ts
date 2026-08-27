// src/app/features/leave/pages/leave-history/leave-history.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { DataTable, DataTableColumn } from '../../../../shared/components/data-table/data-table';
import { LookupCacheService } from '../../../../core/state/lookup-cache.service';
import { LeaveService } from '../../services/leave.service';

@Component({
  selector: 'app-leave-history',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    PageHeader,
    DataTable
  ],
  templateUrl: './leave-history.html',
  styleUrls: ['./leave-history.scss']
})
export class LeaveHistory implements OnInit {
  protected leaveService = inject(LeaveService);
  private lookupCache = inject(LookupCacheService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService, { optional: true });

  showApplyDialog = signal<boolean>(false);
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

  columns: DataTableColumn[] = [
    { field: 'leaveTypeName', header: 'Leave Type', width: '150px', sortable: true, filterable: true },
    { field: 'fromDate', header: 'From Date', width: '130px', type: 'date', sortable: true },
    { field: 'toDate', header: 'To Date', width: '130px', type: 'date', sortable: true },
    { field: 'days', header: 'Days', width: '90px', align: 'center', sortable: true },
    { field: 'reason', header: 'Reason' },
    {
      field: 'status',
      header: 'Status',
      width: '130px',
      type: 'status',
      align: 'center',
      sortable: true,
      filterable: true,
      filterOptions: [
        { label: 'Pending', value: 'Pending' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Rejected', value: 'Rejected' },
        { label: 'Cancelled', value: 'Cancelled' }
      ]
    },
    { field: 'appliedAt', header: 'Applied On', width: '130px', type: 'date' },
    { field: 'remarks', header: 'Approver Remarks' }
  ];

  ngOnInit(): void {
    this.leaveService.loadHistory().subscribe();
    this.leaveService.loadBalances().subscribe();
  }

  openApplyModal(): void {
    this.leaveForm.reset({
      leaveTypeId: this.leaveTypeOptions()[0]?.id || 1,
      fromDate: new Date(),
      toDate: new Date(),
      reason: '',
      emergencyContact: ''
    });
    this.errorMessage.set(null);
    this.showApplyDialog.set(true);
  }

  onSubmitLeave(): void {
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
      fromDate: val.fromDate instanceof Date ? val.fromDate.toISOString().slice(0, 10) : val.fromDate,
      toDate: val.toDate instanceof Date ? val.toDate.toISOString().slice(0, 10) : val.toDate,
      days,
      reason: val.reason,
      emergencyContact: val.emergencyContact
    }).subscribe({
      next: (success) => {
        this.isSubmitting.set(false);
        if (success) {
          this.showApplyDialog.set(false);
          this.messageService?.add({
            severity: 'success',
            summary: 'Leave Application Submitted',
            detail: 'Your leave application has been submitted for approval.',
            life: 4000
          });
          this.leaveService.loadHistory().subscribe();
          this.leaveService.loadBalances().subscribe();
        } else {
          this.errorMessage.set('Failed to apply for leave. Please verify your balance.');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.message || 'Error occurred while submitting request.');
      }
    });
  }
}
