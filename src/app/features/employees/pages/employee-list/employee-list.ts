// src/app/features/employees/pages/employee-list/employee-list.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { DataTable, DataTableColumn } from '../../../../shared/components/data-table/data-table';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { LookupCacheService } from '../../../../core/state/lookup-cache.service';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeListItem } from '../../models/employee.model';

@Component({
  selector: 'app-employee-list',
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
    DataTable,
    HasPermissionDirective
  ],
  templateUrl: './employee-list.html',
  styleUrls: ['./employee-list.scss']
})
export class EmployeeList implements OnInit {
  protected employeeService = inject(EmployeeService);
  private lookupCache = inject(LookupCacheService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService, { optional: true });

  showAddModal = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  departmentOptions = this.lookupCache.departments;
  designationOptions = this.lookupCache.designations;

  genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' }
  ];

  employmentTypeOptions = [
    { label: 'Full-Time', value: 'Full-Time' },
    { label: 'Part-Time', value: 'Part-Time' },
    { label: 'Contract', value: 'Contract' },
    { label: 'Intern', value: 'Intern' }
  ];

  statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Probation', value: 'Probation' },
    { label: 'Notice Period', value: 'Notice Period' },
    { label: 'Inactive', value: 'Inactive' }
  ];

  addEmployeeForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    employeeCode: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_-]{3,20}$/)]],
    email: ['', [Validators.required, Validators.email]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    departmentId: [null, Validators.required],
    designationId: [null, Validators.required],
    joiningDate: [new Date(), Validators.required],
    employmentType: ['Full-Time', Validators.required],
    status: ['Active', Validators.required]
  });

  columns: DataTableColumn[] = [
    { field: 'employeeCode', header: 'Emp Code', width: '110px', sortable: true },
    { field: 'name', header: 'Name', sortable: true, link: true },
    { field: 'email', header: 'Email', sortable: true },
    { field: 'departmentName', header: 'Department', sortable: true, filterable: true },
    { field: 'designationName', header: 'Designation', sortable: true, filterable: true },
    {
      field: 'status',
      header: 'Status',
      width: '130px',
      type: 'status',
      align: 'center',
      sortable: true,
      filterable: true,
      filterOptions: [
        { label: 'Active', value: 'Active' },
        { label: 'Probation', value: 'Probation' },
        { label: 'Notice Period', value: 'Notice Period' },
        { label: 'Inactive', value: 'Inactive' }
      ]
    },
    { field: 'joinDate', header: 'Join Date', width: '130px', type: 'date', sortable: true }
  ];

  ngOnInit(): void {
    this.employeeService.loadEmployees().subscribe();
  }

  onCellLinkClick(event: { row: Record<string, unknown>; column: DataTableColumn }): void {
    if (event.column.field === 'name' && event.row['id']) {
      this.router.navigate(['/employees', event.row['id']]);
    }
  }

  openAddEmployeeModal(): void {
    this.addEmployeeForm.reset({
      firstName: '',
      lastName: '',
      employeeCode: '',
      email: '',
      mobileNumber: '',
      departmentId: this.departmentOptions()[0]?.id || null,
      designationId: this.designationOptions()[0]?.id || null,
      joiningDate: new Date(),
      employmentType: 'Full-Time',
      status: 'Active'
    });
    this.showAddModal.set(true);
  }

  onSubmitAddEmployee(): void {
    if (this.addEmployeeForm.invalid) {
      this.addEmployeeForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const val = this.addEmployeeForm.value;
    const payload = {
      ...val,
      name: `${val.firstName} ${val.lastName}`,
      joiningDate: val.joiningDate instanceof Date ? val.joiningDate.toISOString().slice(0, 10) : val.joiningDate
    };

    this.employeeService.createEmployee(payload).subscribe({
      next: (success) => {
        this.isSubmitting.set(false);
        this.showAddModal.set(false);
        if (success) {
          this.messageService?.add({
            severity: 'success',
            summary: 'Employee Created',
            detail: `${payload.name} has been successfully added to the staff directory.`,
            life: 4000
          });
          this.employeeService.loadEmployees().subscribe();
        }
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}
