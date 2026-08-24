// src/app/features/attendance/attendance.routes.ts
import { Routes } from '@angular/router';

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'log',
    pathMatch: 'full'
  },
  {
    path: 'log',
    loadComponent: () => import('./pages/attendance-log/attendance-log').then(m => m.AttendanceLog)
  },
  {
    path: 'calendar',
    loadComponent: () => import('./pages/attendance-calendar/attendance-calendar').then(m => m.AttendanceCalendar)
  },
  {
    path: 'regularization',
    loadComponent: () => import('./pages/regularization-requests/regularization-requests').then(m => m.RegularizationRequests)
  }
];
