// src/app/core/permissions/permission.service.ts
import { Injectable, computed, inject } from '@angular/core';
import { AuthStore } from '../auth/auth.store';
import { Permission, UserRole } from './permission.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private authStore = inject(AuthStore);

  /**
   * Signal of all granted permissions as a Set
   */
  readonly permissions = computed(() => this.authStore.permissions());

  /**
   * Signal of current user roles
   */
  readonly roles = computed<UserRole[]>(() => {
    const user = this.authStore.user();
    return (user?.roles ?? []) as UserRole[];
  });

  /**
   * Checks whether the current user has a specific permission
   */
  hasPermission(permission: Permission): boolean {
    if (!permission) return true;
    return this.authStore.hasPermission(permission);
  }

  /**
   * Checks whether the current user has ANY of the specified permissions
   */
  hasAnyPermission(permissions: Permission[]): boolean {
    if (!permissions || permissions.length === 0) return true;
    return permissions.some(p => this.authStore.hasPermission(p));
  }

  /**
   * Checks whether the current user has ALL of the specified permissions
   */
  hasAllPermissions(permissions: Permission[]): boolean {
    if (!permissions || permissions.length === 0) return true;
    return permissions.every(p => this.authStore.hasPermission(p));
  }

  /**
   * Checks whether the current user has a specific role
   */
  hasRole(role: UserRole | string): boolean {
    return this.authStore.hasRole(role);
  }

  /**
   * Checks whether the current user has ANY of the specified roles
   */
  hasAnyRole(roles: (UserRole | string)[]): boolean {
    if (!roles || roles.length === 0) return true;
    return roles.some(r => this.authStore.hasRole(r));
  }
}
