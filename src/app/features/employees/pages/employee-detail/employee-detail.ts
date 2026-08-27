// src/app/features/employees/pages/employee-detail/employee-detail.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TabsModule } from 'primeng/tabs';
import { MessageService } from 'primeng/api';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { Avatar } from '../../../../shared/components/avatar/avatar';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { LoadingSkeleton } from '../../../../shared/components/loading-skeleton/loading-skeleton';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { CurrencyPipe } from '../../../../shared/pipes/currency.pipe';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    TabsModule,
    PageHeader,
    Avatar,
    StatusBadge,
    LoadingSkeleton,
    DateFormatPipe,
    CurrencyPipe,
    HasPermissionDirective
  ],
  templateUrl: './employee-detail.html',
  styleUrls: ['./employee-detail.scss']
})
export class EmployeeDetail implements OnInit {
  protected employeeService = inject(EmployeeService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService, { optional: true });

  employeeId = signal<number>(1);
  activeTab = signal<string>('personal');
  showEditModal = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' }
  ];

  editForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    emergencyContact: [''],
    gender: ['Male'],
    address: ['', Validators.required],
    bankName: [''],
    bankAccountNo: [''],
    ifscCode: [''],
    panNo: ['']
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? parseInt(idParam, 10) : 1;
    this.employeeId.set(id);
    this.employeeService.getEmployeeDetail(id).subscribe();
  }

  openEditModal(): void {
    const emp = this.employeeService.selectedEmployee();
    if (emp) {
      this.editForm.patchValue({
        name: emp.personal.name || emp.personal.empName || '',
        email: emp.personal.email || '',
        phone: emp.personal.phone || emp.personal.mobileNumber || '',
        emergencyContact: emp.personal.emergencyContact || '',
        gender: emp.personal.gender || 'Male',
        address: emp.personal.address || '',
        bankName: emp.bankInfo?.bankName || '',
        bankAccountNo: emp.bankInfo?.bankAccountNo || '',
        ifscCode: emp.bankInfo?.ifscCode || '',
        panNo: emp.personal.panNo || ''
      });
    }
    this.showEditModal.set(true);
  }

  onSaveEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const val = this.editForm.value;

    this.employeeService.updateEmployee({ id: this.employeeId(), ...val }).subscribe({
      next: (success) => {
        this.isSaving.set(false);
        if (success) {
          this.showEditModal.set(false);
          this.messageService?.add({
            severity: 'success',
            summary: 'Profile Updated',
            detail: 'Employee profile updated successfully.',
            life: 4000
          });
          this.employeeService.getEmployeeDetail(this.employeeId()).subscribe();
        }
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }
}


