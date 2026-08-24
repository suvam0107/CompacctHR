// src/app/core/sync/sync.service.ts
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, forkJoin, of, timer } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { SyncStore } from './sync.store';
import { buildSyncTasks, SyncTask } from './sync-task-registry';
import { LoggerService } from '../logging/logger.service';
import { LookupCacheService } from '../state/lookup-cache.service';
import { MenuService } from '../state/menu.service';
import { NotificationService } from '../state/notification.service';
import { DashboardService } from '../../features/dashboard/services/dashboard.service';
import { LeaveService } from '../../features/dashboard/services/leave.service';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private syncStore = inject(SyncStore);
  private logger = inject(LoggerService);
  private router = inject(Router);

  // Injected at service instantiation time (valid injection context)
  private lookupCache = inject(LookupCacheService);
  private menuService = inject(MenuService);
  private dashboardService = inject(DashboardService);
  private leaveService = inject(LeaveService);
  private notificationService = inject(NotificationService);

  run(returnUrl: string = '/dashboard'): Observable<boolean> {
    const tasks: SyncTask[] = buildSyncTasks({
      lookupCache: this.lookupCache,
      menuService: this.menuService,
      dashboardService: this.dashboardService,
      leaveService: this.leaveService,
      notificationService: this.notificationService
    });

    this.syncStore.initTasks(tasks);
    this.syncStore.setSyncing(true);

    this.logger.info('SyncService: Starting application warm-up with', tasks.length, 'tasks');

    const taskObservables = tasks.map((task, index) => {
      // Stagger start slightly for smooth visual progression
      return timer(index * 120).pipe(
        tap(() => {
          this.syncStore.updateTaskStatus(task.id, 'running');
        }),
        switchMap(() => task.run()),
        tap(() => {
          this.syncStore.updateTaskStatus(task.id, 'done');
          this.logger.debug(`Sync task [${task.id}] completed`);
        }),
        map(() => true),
        catchError(err => {
          this.logger.error(`Sync task [${task.id}] failed`, err);
          this.syncStore.updateTaskStatus(
            task.id,
            'error',
            err?.message || 'Failed to load'
          );

          if (task.critical) {
            this.syncStore.setCriticalError(
              `Critical warm-up step "${task.label}" failed.`
            );
          }

          // Non-critical failures return false to let forkJoin complete
          return of(false);
        })
      );
    });

    return forkJoin(taskObservables).pipe(
      map(() => {
        const hasCritical = this.syncStore.hasCriticalFailure();
        if (hasCritical) {
          this.logger.error('SyncService: Warm-up failed due to critical task failure');
          return false;
        }

        this.syncStore.setSynced(true);
        this.logger.info('SyncService: Warm-up completed successfully. Navigating to', returnUrl);

        // Allow user to see 100% progress before transition
        setTimeout(() => {
          this.router.navigateByUrl(returnUrl);
        }, 500);

        return true;
      })
    );
  }

  retry(returnUrl: string = '/dashboard'): Observable<boolean> {
    return this.run(returnUrl);
  }
}
