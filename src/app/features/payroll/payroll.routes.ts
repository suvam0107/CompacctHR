// src/app/features/payroll/payroll.routes.ts
import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/permissions/permission.guard';

export const PAYROLL_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'payslips',
    pathMatch: 'full'
  },
  {
    path: 'payslips',
    loadComponent: () => import('./pages/payslips/payslips').then(m => m.Payslips)
  },
  {
    path: 'salary-structure',
    loadComponent: () => import('./pages/salary-structure/salary-structure').then(m => m.SalaryStructure)
  },
  {
    path: 'processing',
    canMatch: [permissionGuard('payroll:process')],
    loadComponent: () => import('./pages/payroll-processing/payroll-processing').then(m => m.PayrollProcessing)
  }
];
