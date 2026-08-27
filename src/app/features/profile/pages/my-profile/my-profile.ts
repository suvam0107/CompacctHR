// src/app/features/profile/pages/my-profile/my-profile.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { Avatar } from '../../../../shared/components/avatar/avatar';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { LoadingSkeleton } from '../../../../shared/components/loading-skeleton/loading-skeleton';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    PageHeader,
    Avatar,
    StatusBadge,
    LoadingSkeleton,
    DateFormatPipe
  ],
  templateUrl: './my-profile.html',
  styleUrls: ['./my-profile.scss']
})
export class MyProfile implements OnInit {
  protected profileService = inject(ProfileService);
  private fb = inject(FormBuilder);

  isEditing = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  saveSuccess = signal<boolean>(false);

  genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' }
  ];

  profileForm: FormGroup = this.fb.group({
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
    this.profileService.loadMyProfile().subscribe(data => {
      if (data) {
        this.profileForm.patchValue({
          name: data.personal.name || data.personal.empName || '',
          email: data.personal.email || '',
          phone: data.personal.phone || data.personal.mobileNumber || '',
          emergencyContact: data.personal.emergencyContact || '',
          gender: data.personal.gender || 'Male',
          address: data.personal.address || '',
          bankName: data.bankInfo?.bankName || '',
          bankAccountNo: data.bankInfo?.bankAccountNo || '',
          ifscCode: data.bankInfo?.ifscCode || '',
          panNo: data.personal.panNo || ''
        });
      }
    });
  }

  toggleEdit(): void {
    this.isEditing.update(e => !e);
    this.saveSuccess.set(false);
  }

  onSave(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.profileService.updateProfile(this.profileForm.value).subscribe(success => {
      this.isSaving.set(false);
      if (success) {
        this.isEditing.set(false);
        this.saveSuccess.set(true);
        this.profileService.loadMyProfile().subscribe();
      }
    });
  }
}

