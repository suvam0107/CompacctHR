// src/app/auth/pages/forgot-password/forgot-password.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordResetService } from '../../services/password-reset.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss']
})
export class ForgotPassword {
  private fb = inject(FormBuilder);
  private passwordResetService = inject(PasswordResetService);

  resetForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  isLoading = signal<boolean>(false);
  isSubmitted = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const email = this.resetForm.value.email;
    this.passwordResetService.requestPasswordReset(email).subscribe({
      next: res => {
        this.isLoading.set(false);
        this.isSubmitted.set(true);
        this.successMessage.set(res.message);
      },
      error: err => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Failed to submit reset request. Please try again.');
      }
    });
  }
}
