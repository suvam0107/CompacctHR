// src/app/features/employees/employees.routes.ts
import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/permissions/permission.guard';

export const EMPLOYEE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/employee-list/employee-list').then(m => m.EmployeeList)
  },
  {
    path: 'new',
    canMatch: [permissionGuard('employee:create')],
    loadComponent: () => import('./pages/employee-form/employee-form').then(m => m.EmployeeForm)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/employee-detail/employee-detail').then(m => m.EmployeeDetail)
  },
  {
    path: ':id/edit',
    canMatch: [permissionGuard('employee:edit')],
    loadComponent: () => import('./pages/employee-form/employee-form').then(m => m.EmployeeForm)
  }
];
