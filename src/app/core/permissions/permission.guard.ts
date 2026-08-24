// src/app/core/permissions/permission.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Route, Router, UrlSegment } from '@angular/router';
import { PermissionService } from './permission.service';
import { Permission } from './permission.model';

/**
 * Functional CanMatchFn guard for route-level RBAC checking.
 * Usage: canMatch: [permissionGuard('employee:view')]
 */
export function permissionGuard(requiredPermission: Permission | Permission[]): CanMatchFn {
  return (_route: Route, _segments: UrlSegment[]) => {
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    const hasAccess = Array.isArray(requiredPermission)
      ? permissionService.hasAnyPermission(requiredPermission)
      : permissionService.hasPermission(requiredPermission);

    if (!hasAccess) {
      // If user lacks permission, do not match the route (or redirect)
      return router.parseUrl('/dashboard');
    }

    return true;
  };
}

/**
 * Functional CanActivateFn guard for route-level RBAC checking.
 * Usage: canActivate: [requirePermission('employee:view')]
 */
export function requirePermission(requiredPermission: Permission | Permission[]): CanActivateFn {
  return () => {
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    const hasAccess = Array.isArray(requiredPermission)
      ? permissionService.hasAnyPermission(requiredPermission)
      : permissionService.hasPermission(requiredPermission);

    if (!hasAccess) {
      return router.createUrlTree(['/dashboard']);
    }

    return true;
  };
}
