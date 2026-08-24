// src/app/features/admin/services/admin.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, map, of, catchError } from 'rxjs';
import { APIService } from '../../../core/api/api.service';
import { SPC } from '../../../core/api/spc-registry';
import { LoggerService } from '../../../core/logging/logger.service';
import { AdminUserItem, AdminRoleItem, SystemSettingItem } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = inject(APIService);
  private logger = inject(LoggerService);

  private _users = signal<AdminUserItem[]>([]);
  private _roles = signal<AdminRoleItem[]>([]);
  private _settings = signal<SystemSettingItem[]>([
    {
      key: 'app_title',
      category: 'General',
      label: 'Organization Name',
      value: 'CompacctHR Technologies Pvt Ltd',
      description: 'The organization name shown on reports and payslips'
    },
    {
      key: 'session_timeout_min',
      category: 'Security',
      label: 'Access Token Expiry (Minutes)',
      value: 60,
      description: 'Duration before client token is renewed silently via refresh cookie'
    },
    {
      key: 'biometric_grace_period_min',
      category: 'Attendance',
      label: 'Late Grace Period (Minutes)',
      value: 15,
      description: 'Grace period allowed after 09:00 AM before marking late attendance'
    },
    {
      key: 'enable_email_notifications',
      category: 'Notifications',
      label: 'Enable Email Notifications',
      value: true,
      description: 'Send automated email notifications on leave status changes'
    }
  ]);
  private _isLoading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  readonly users = this._users.asReadonly();
  readonly roles = this._roles.asReadonly();
  readonly settings = this._settings.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  loadUsers(): Observable<AdminUserItem[]> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.callNonNested<AdminUserItem[]>(SPC.ADMIN_GET_USERS).pipe(
      tap(res => {
        this._isLoading.set(false);
        if (res.success && Array.isArray(res.data)) {
          this._users.set(res.data);
        }
      }),
      map(res => (res.success && Array.isArray(res.data) ? res.data : [])),
      catchError(err => {
        this._isLoading.set(false);
        this._error.set(err.message || 'Failed to load users');
        this.logger.error('AdminService.loadUsers failed', err);
        return of([]);
      })
    );
  }

  loadRoles(): Observable<AdminRoleItem[]> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.callNonNested<AdminRoleItem[]>(SPC.ADMIN_GET_ROLES).pipe(
      tap(res => {
        this._isLoading.set(false);
        if (res.success && Array.isArray(res.data)) {
          this._roles.set(res.data);
        }
      }),
      map(res => (res.success && Array.isArray(res.data) ? res.data : [])),
      catchError(err => {
        this._isLoading.set(false);
        this._error.set(err.message || 'Failed to load roles');
        this.logger.error('AdminService.loadRoles failed', err);
        return of([]);
      })
    );
  }

  assignRole(userId: number, roles: string[]): Observable<boolean> {
    return this.api.callNonNested(SPC.ADMIN_ASSIGN_ROLE, { userId, roles }).pipe(
      map(res => !!res.success)
    );
  }
}
