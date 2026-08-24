// src/app/auth/pages/login/login.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Login } from './login';
import { AuthService } from '../../../core/auth/auth.service';

describe('Login Component', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let mockAuthService: { login: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockAuthService = {
      login: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the login component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with invalid state when empty', () => {
    expect(component.loginForm.valid).toBe(false);
    expect(component.loginForm.controls.username.errors?.['required']).toBe(true);
    expect(component.loginForm.controls.password.errors?.['required']).toBe(true);
  });

  it('should validate minLength for username', () => {
    const username = component.loginForm.controls.username;
    username.setValue('ab');
    expect(username.errors?.['minlength']).toBeTruthy();

    username.setValue('ADMIN');
    expect(username.errors).toBeNull();
  });

  it('should validate minLength for password', () => {
    const password = component.loginForm.controls.password;
    password.setValue('123');
    expect(password.errors?.['minlength']).toBeTruthy();

    password.setValue('secret123');
    expect(password.errors).toBeNull();
  });

  it('should not call authService.login if form is invalid', () => {
    component.onSubmit();
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should call authService.login on valid form submission', () => {
    mockAuthService.login.mockReturnValue(
      of({
        user: { id: 1, name: 'ADMIN', email: 'admin@compacct.in', roles: ['SuperAdmin'] },
        permissions: [],
        menuFlags: {}
      })
    );

    component.loginForm.controls.username.setValue('ADMIN');
    component.loginForm.controls.password.setValue('compacct');

    component.onSubmit();

    expect(mockAuthService.login).toHaveBeenCalledWith('ADMIN', 'compacct');
    expect(component.errorMessage()).toBeNull();
    expect(component.isLoading()).toBe(false);
  });

  it('should set error message when login fails', () => {
    mockAuthService.login.mockReturnValue(
      throwError(() => new Error('Invalid username or password.'))
    );

    component.loginForm.controls.username.setValue('ADMIN');
    component.loginForm.controls.password.setValue('wrongpassword');

    component.onSubmit();

    expect(component.errorMessage()).toBe('Invalid username or password.');
    expect(component.isLoading()).toBe(false);
  });
});
