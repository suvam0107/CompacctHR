// src/app/features/employees/pages/employee-form/employee-form.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { LookupCacheService } from '../../../../core/state/lookup-cache.service';
import { EmployeeService } from '../../services/employee.service';
import { zodFormValidator } from '../../../../shared/validators/zod-form.validator';
import { employeePersonalSchema, employeeBankSchema } from '../../../../shared/validators/schemas/employee.schema';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    PageHeader
  ],
  templateUrl: './employee-form.html',
  styleUrls: ['./employee-form.scss']
})
export class EmployeeForm implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private lookupCache = inject(LookupCacheService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEditMode = signal<boolean>(false);
  employeeId = signal<number | null>(null);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

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
    { label: 'On Leave', value: 'OnLeave' },
    { label: 'Inactive', value: 'Inactive' }
  ];

  employeeForm: FormGroup = this.fb.group({
    employeeCode: ['', Validators.required],
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, zodFormValidator(employeePersonalSchema.shape.mobileNumber)]],
    emergencyContact: ['', zodFormValidator(employeePersonalSchema.shape.emergencyContact)],
    dob: [null, Validators.required],
    gender: ['Male', Validators.required],
    address: ['', Validators.required],
    departmentId: [null, Validators.required],
    designationId: [null, Validators.required],
    joinDate: [new Date(), Validators.required],
    employmentType: ['Full-Time', Validators.required],
    status: ['Active', Validators.required],
    ctc: [null, [Validators.required, Validators.min(0)]],
    panNo: ['', zodFormValidator(employeePersonalSchema.shape.panNo)],
    bankName: [''],
    bankAccountNo: [''],
    ifscCode: ['', zodFormValidator(employeeBankSchema.shape.ifscCode)]
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      const id = parseInt(idParam, 10);
      this.isEditMode.set(true);
      this.employeeId.set(id);
      this.loadEmployeeData(id);
    }
  }

  private loadEmployeeData(id: number): void {
    this.employeeService.getEmployeeDetail(id).subscribe(emp => {
      if (emp) {
        this.employeeForm.patchValue({
          employeeCode: emp.personal.employeeCode,
          name: emp.personal.name,
          email: emp.personal.email,
          phone: emp.personal.phone,
          emergencyContact: emp.personal.emergencyContact,
          dob: emp.personal.dob ? new Date(emp.personal.dob) : null,
          gender: emp.personal.gender,
          address: emp.personal.address,
          departmentId: emp.employment.departmentId,
          designationId: emp.employment.designationId,
          joinDate: emp.employment.joinDate ? new Date(emp.employment.joinDate) : null,
          employmentType: emp.employment.employmentType,
          status: emp.employment.status,
          ctc: emp.salaryInfo?.ctc || 0,
          panNo: emp.personal.panNo || '',
          bankName: emp.bankInfo?.bankName || '',
          bankAccountNo: emp.bankInfo?.bankAccountNo || '',
          ifscCode: emp.bankInfo?.ifscCode || ''
        });
      }
    });
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload = this.employeeForm.value;

    const req$ = this.isEditMode() && this.employeeId()
      ? this.employeeService.updateEmployee({ id: this.employeeId(), ...payload })
      : this.employeeService.createEmployee(payload);

    req$.subscribe({
      next: success => {
        this.isSubmitting.set(false);
        if (success) {
          this.router.navigate(['/employees']);
        } else {
          this.errorMessage.set('Failed to save employee profile.');
        }
      },
      error: err => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.message || 'Failed to save employee record.');
      }
    });
  }
}
