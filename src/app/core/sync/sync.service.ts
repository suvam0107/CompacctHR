// src/app/core/sync/sync.service.ts
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of, Observable, timer } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { LoggerService } from '../logging/logger.service';
import { AuthStore } from '../auth/auth.store';
import { SyncStore } from './sync.store';
import { getSyncTasks, SyncTask } from './sync-task-registry';
import { LookupCacheService } from '../state/lookup-cache.service';
import { MenuService } from '../state/menu.service';
import { NotificationService } from '../state/notification.service';
import { DashboardService } from '../../features/dashboard/services/dashboard.service';
import { LeaveService } from '../../features/dashboard/services/leave.service';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private syncStore = inject(SyncStore);
  private logger = inject(LoggerService);
  private messageService = inject(MessageService);
  private authStore = inject(AuthStore);
  private router = inject(Router);

  private lookupCache = inject(LookupCacheService);
  private menuService = inject(MenuService);
  private dashboardService = inject(DashboardService);
  private leaveService = inject(LeaveService);
  private notifService = inject(NotificationService);

  runSync(returnUrl?: string): Observable<boolean> {
    const tasks: SyncTask[] = getSyncTasks({
      lookupCache: this.lookupCache,
      menuService: this.menuService,
      dashboardService: this.dashboardService,
      leaveService: this.leaveService,
      notifService: this.notifService
    });
    this.syncStore.initialize(tasks);

    // Create parallel observable streams for each task with individual status updates
    const taskObservables = tasks.map(task =>
      task.run().pipe(
        tap(() => {
          this.syncStore.updateTaskStatus(task.id, 'done');
          this.logger.debug(`Sync: Task "${task.label}" completed successfully`);
        }),
        catchError(err => {
          this.syncStore.updateTaskStatus(task.id, 'error', err?.message || 'Failed');
          this.logger.error(`Sync: Task "${task.label}" failed`, err);
          return of(null);
        })
      )
    );

    return forkJoin(taskObservables).pipe(
      // Add slight delay so the user experiences smooth completion transition
      switchMap(() => timer(300)),
      map(() => {
        if (this.syncStore.hasCriticalFailure()) {
          this.logger.error('Sync: Critical warm-up task failed. Redirecting to login.');
          this.messageService.add({
            severity: 'error',
            summary: 'Initialization Failed',
            detail: 'Unable to load critical system resources. Please try logging in again.',
            life: 5000
          });
          this.authStore.clearSession();
          this.syncStore.reset();
          this.router.navigate(['/auth/login']);
          return false;
        }

        this.syncStore.setSynced(true);
        const destination = returnUrl || '/dashboard';
        this.logger.info(`Sync: All tasks settled. Navigating to ${destination}`);
        this.router.navigateByUrl(destination);
        return true;
      }),
      catchError(err => {
        this.logger.error('Sync: Unexpected orchestration error', err);
        this.authStore.clearSession();
        this.syncStore.reset();
        this.router.navigate(['/auth/login']);
        return of(false);
      })
    );
  }
}
