// src/app/features/admin/admin.routes.ts
import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full'
  },
  {
    path: 'users',
    loadComponent: () => import('./pages/user-management/user-management').then(m => m.UserManagement)
  },
  {
    path: 'roles',
    loadComponent: () => import('./pages/role-management/role-management').then(m => m.RoleManagement)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/system-settings/system-settings').then(m => m.SystemSettings)
  }
];
