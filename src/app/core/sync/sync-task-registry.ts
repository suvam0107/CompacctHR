// src/app/core/sync/sync-task-registry.ts
import { Observable } from 'rxjs';
import { LookupCacheService } from '../state/lookup-cache.service';
import { MenuService } from '../state/menu.service';
import { NotificationService } from '../state/notification.service';
import { DashboardService } from '../../features/dashboard/services/dashboard.service';
import { LeaveService } from '../../features/dashboard/services/leave.service';

export interface SyncTask {
  id: string;
  label: string;              // "Fetching Dashboard Summary" — never a spcKey or raw SP name
  critical: boolean;          // true = failure blocks entry to the app
  run: () => Observable<unknown>;
}

export interface SyncServices {
  lookupCache: LookupCacheService;
  menuService: MenuService;
  dashboardService: DashboardService;
  leaveService: LeaveService;
  notifService: NotificationService;
}

export function getSyncTasks(services: SyncServices): SyncTask[] {
  return [
    {
      id: 'lookups',
      label: 'Loading Reference Data',
      critical: true,
      run: () => services.lookupCache.warmUp()
    },
    {
      id: 'menu',
      label: 'Loading Navigation',
      critical: true,
      run: () => services.menuService.warmUp()
    },
    {
      id: 'dashboard',
      label: 'Fetching Dashboard Summary',
      critical: false,
      run: () => services.dashboardService.prefetchSummary()
    },
    {
      id: 'leave-balance',
      label: 'Fetching Leave Balance',
      critical: false,
      run: () => services.leaveService.prefetchBalance()
    },
    {
      id: 'notifications',
      label: 'Loading Notifications',
      critical: false,
      run: () => services.notifService.prefetchCount()
    }
  ];
}
