// src/app/features/leave/leave.routes.ts
import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/permissions/permission.guard';

export const LEAVE_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'history',
    pathMatch: 'full'
  },
  {
    path: 'apply',
    loadComponent: () => import('./pages/leave-apply/leave-apply').then(m => m.LeaveApply)
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/leave-history/leave-history').then(m => m.LeaveHistory)
  },
  {
    path: 'approvals',
    canMatch: [permissionGuard('leave:approve')],
    loadComponent: () => import('./pages/leave-approvals/leave-approvals').then(m => m.LeaveApprovals)
  }
];
