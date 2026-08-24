// src/app/features/profile/pages/my-profile/my-profile.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { Avatar } from '../../../../shared/components/avatar/avatar';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { LoadingSkeleton } from '../../../../shared/components/loading-skeleton/loading-skeleton';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { CurrencyPipe } from '../../../../shared/pipes/currency.pipe';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
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

  profileForm: FormGroup = this.fb.group({
    phone: ['', Validators.required],
    address: ['', Validators.required]
  });

  ngOnInit(): void {
    this.profileService.loadMyProfile().subscribe(data => {
      if (data) {
        this.profileForm.patchValue({
          phone: data.personal.phone,
          address: data.personal.address
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
