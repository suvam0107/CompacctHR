// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { syncGuard } from './core/sync/sync.guard';
import { permissionGuard } from './core/permissions/permission.guard';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'sync',
    loadComponent: () => import('./core/sync/sync').then(m => m.Sync),
    canActivate: [authGuard]
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard, syncGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'employees',
        canMatch: [permissionGuard('employee:view')],
        loadChildren: () => import('./features/employees/employees.routes').then(m => m.EMPLOYEE_ROUTES)
      },
      {
        path: 'attendance',
        canMatch: [permissionGuard('attendance:view')],
        loadChildren: () => import('./features/attendance/attendance.routes').then(m => m.ATTENDANCE_ROUTES)
      },
      {
        path: 'leave',
        canMatch: [permissionGuard('leave:view')],
        loadChildren: () => import('./features/leave/leave.routes').then(m => m.LEAVE_ROUTES)
      },
      {
        path: 'payroll',
        canMatch: [permissionGuard('payroll:view')],
        loadChildren: () => import('./features/payroll/payroll.routes').then(m => m.PAYROLL_ROUTES)
      },
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES)
      },
      {
        path: 'admin',
        canMatch: [permissionGuard('admin:access')],
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
