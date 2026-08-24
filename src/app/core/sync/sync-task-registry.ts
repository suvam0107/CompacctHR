// src/app/core/sync/sync-task-registry.ts
import { Observable } from 'rxjs';
import { LookupCacheService } from '../state/lookup-cache.service';
import { MenuService } from '../state/menu.service';
import { NotificationService } from '../state/notification.service';
import { DashboardService } from '../../features/dashboard/services/dashboard.service';
import { LeaveService } from '../../features/dashboard/services/leave.service';

export interface SyncTask {
  id: string;
  label: string; // Friendly user-facing label
  critical: boolean; // true = failure blocks entry and aborts to login
  run: () => Observable<unknown>;
}

export interface SyncServicesContext {
  lookupCache: LookupCacheService;
  menuService: MenuService;
  dashboardService: DashboardService;
  leaveService: LeaveService;
  notificationService: NotificationService;
}

export function buildSyncTasks(ctx: SyncServicesContext): SyncTask[] {
  return [
    {
      id: 'lookups',
      label: 'Loading Reference Data',
      critical: true,
      run: () => ctx.lookupCache.warmUp()
    },
    {
      id: 'menu',
      label: 'Loading Navigation',
      critical: true,
      run: () => ctx.menuService.warmUp()
    },
    {
      id: 'dashboard',
      label: 'Fetching Dashboard Summary',
      critical: false,
      run: () => ctx.dashboardService.prefetchSummary()
    },
    {
      id: 'leave-balance',
      label: 'Fetching Leave Balance',
      critical: false,
      run: () => ctx.leaveService.prefetchBalance()
    },
    {
      id: 'notifications',
      label: 'Loading Notifications',
      critical: false,
      run: () => ctx.notificationService.prefetchCount()
    }
  ];
}
