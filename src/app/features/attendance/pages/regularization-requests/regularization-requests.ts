// src/app/features/attendance/pages/regularization-requests/regularization-requests.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { DataTable, DataTableColumn } from '../../../../shared/components/data-table/data-table';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AttendanceService } from '../../services/attendance.service';
import { RegularizationRequest } from '../../models/attendance.model';

@Component({
  selector: 'app-regularization-requests',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    TooltipModule,
    PageHeader,
    DataTable
  ],
  templateUrl: './regularization-requests.html',
  styleUrls: ['./regularization-requests.scss']
})
export class RegularizationRequests implements OnInit {
  protected attendanceService = inject(AttendanceService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService, { optional: true });

  showApplyDialog = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // Approval / Rejection action state
  selectedRequest = signal<RegularizationRequest | null>(null);
  actionType = signal<'approve' | 'reject'>('approve');
  showActionDialog = signal<boolean>(false);
  approverRemarks = signal<string>('');
  isProcessing = signal<boolean>(false);

  statusOptions = [
    { label: 'Present', value: 'Present' },
    { label: 'Half Day', value: 'HalfDay' },
    { label: 'On Duty / Client Visit', value: 'OnDuty' }
  ];

  regForm: FormGroup = this.fb.group({
    date: [new Date(), Validators.required],
    requestedStatus: ['Present', Validators.required],
    reason: ['', [Validators.required, Validators.minLength(5)]]
  });

  columns: DataTableColumn[] = [
    { field: 'employeeName', header: 'Employee', sortable: true },
    { field: 'date', header: 'Date', width: '120px', type: 'date', sortable: true },
    { field: 'originalStatus', header: 'Original', width: '110px', filterable: true },
    { field: 'requestedStatus', header: 'Requested', width: '120px', filterable: true },
    { field: 'reason', header: 'Reason' },
    {
      field: 'status',
      header: 'Request Status',
      width: '130px',
      type: 'status',
      align: 'center',
      sortable: true,
      filterable: true,
      filterOptions: [
        { label: 'Pending', value: 'Pending' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Rejected', value: 'Rejected' }
      ]
    },
    { field: 'submittedAt', header: 'Submitted At', width: '140px', type: 'date' }
  ];

  ngOnInit(): void {
    this.attendanceService.loadRegularizationRequests().subscribe();
  }

  openApplyModal(): void {
    this.regForm.reset({
      date: new Date(),
      requestedStatus: 'Present',
      reason: ''
    });
    this.showApplyDialog.set(true);
  }

  onSubmitRegularization(): void {
    if (this.regForm.invalid) {
      this.regForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.attendanceService.submitRegularization(this.regForm.value).subscribe(success => {
      this.isSubmitting.set(false);
      this.showApplyDialog.set(false);
      if (success) {
        this.messageService?.add({
          severity: 'success',
          summary: 'Request Submitted',
          detail: 'Your attendance regularization request has been submitted successfully.',
          life: 4000
        });
        this.attendanceService.loadRegularizationRequests().subscribe();
      }
    });
  }

  openApprovalModal(item: RegularizationRequest, type: 'approve' | 'reject'): void {
    this.selectedRequest.set(item);
    this.actionType.set(type);
    this.approverRemarks.set('');
    this.showActionDialog.set(true);
  }

  confirmApprovalAction(): void {
    const req = this.selectedRequest();
    if (!req) return;

    this.isProcessing.set(true);
    const action$ = this.actionType() === 'approve'
      ? this.attendanceService.approveRegularization(req.id, this.approverRemarks())
      : this.attendanceService.rejectRegularization(req.id, this.approverRemarks());

    action$.subscribe({
      next: (success) => {
        this.isProcessing.set(false);
        this.showActionDialog.set(false);
        if (success) {
          this.messageService?.add({
            severity: this.actionType() === 'approve' ? 'success' : 'info',
            summary: this.actionType() === 'approve' ? 'Request Approved' : 'Request Rejected',
            detail: `Regularization request for ${req.employeeName} has been ${this.actionType()}d.`,
            life: 4000
          });
        }
      },
      error: () => {
        this.isProcessing.set(false);
      }
    });
  }
}
