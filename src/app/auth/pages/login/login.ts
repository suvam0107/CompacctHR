// src/app/auth/pages/login/login.ts
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Checkbox } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Button,
    InputText,
    Password,
    Checkbox
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private authService = inject(AuthService);
  private messageService = inject(MessageService, { optional: true });
  private router = inject(Router);

  readonly loginForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)]
    }),
    rememberMe: new FormControl(false, { nonNullable: true })
  });

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    const { username, password } = this.loginForm.getRawValue();

    this.authService.login(username, password).pipe(
      finalize(() => {
        this.isLoading.set(false);
      })
    ).subscribe({
      next: (session) => {
        this.errorMessage.set(null);
        this.messageService?.add({
          severity: 'success',
          summary: 'Authenticated',
          detail: `Welcome back, ${session.user.name}! (${session.user.roles.join(', ')})`,
          life: 4000
        });
      },
      error: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
        this.errorMessage.set(message);
      }
    });
  }
}
