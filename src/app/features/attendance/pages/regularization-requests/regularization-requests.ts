// src/app/features/attendance/pages/regularization-requests/regularization-requests.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { DataTable, DataTableColumn } from '../../../../shared/components/data-table/data-table';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AttendanceService } from '../../services/attendance.service';
import { RegularizationRequest } from '../../models/attendance.model';

import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-regularization-requests',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
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
    { field: 'originalStatus', header: 'Original', width: '110px' },
    { field: 'requestedStatus', header: 'Requested', width: '120px' },
    { field: 'reason', header: 'Reason' },
    { field: 'status', header: 'Request Status', width: '120px', type: 'status', align: 'center', sortable: true },
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
}
