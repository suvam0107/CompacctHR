// src/app/core/auth/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, switchMap, tap, of, throwError, forkJoin, catchError } from 'rxjs';
import { APIService } from '../api/api.service';
import { SPC } from '../api/spc-registry';
import { AuthStore } from './auth.store';
import { AuthLoginResponse, AuthSessionResponse } from './models/auth-response.model';
import { getErrorMessage } from '../api/error-code-map';
import { LookupCacheService } from '../state/lookup-cache.service';
import { NotificationService } from '../state/notification.service';
import { DashboardService } from '../../features/dashboard/services/dashboard.service';
import { LeaveService } from '../../features/dashboard/services/leave.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(APIService);
  private authStore = inject(AuthStore);
  private router = inject(Router);

  private lookupCache = inject(LookupCacheService);
  private notifService = inject(NotificationService);
  private dashboardService = inject(DashboardService);
  private leaveService = inject(LeaveService);

  login(username: string, password: string): Observable<AuthSessionResponse> {
    return this.api.callNonNested<AuthLoginResponse>(SPC.AUTH_LOGIN, { username, password }).pipe(
      switchMap(loginRes => {
        if (!loginRes.success || !loginRes.data?.accessToken) {
          const errorMsg = getErrorMessage(loginRes.errorCode);
          return throwError(() => new Error(errorMsg));
        }

        // Store access token in-memory
        this.authStore.setToken(loginRes.data.accessToken);

        // Fetch session data (user + roles + permissions)
        return this.api.callNested<AuthSessionResponse>(SPC.AUTH_ME);
      }),
      switchMap(sessionRes => {
        if (!sessionRes.success || !sessionRes.data?.user) {
          const errorMsg = getErrorMessage(sessionRes.errorCode);
          return throwError(() => new Error(errorMsg));
        }

        this.authStore.setSession(sessionRes.data.user, sessionRes.data.permissions ?? []);
        return of(sessionRes.data);
      }),
      tap(() => {
        // Trigger warm-up API calls concurrently in background
        forkJoin([
          this.lookupCache.warmUp().pipe(catchError(() => of(false))),
          this.notifService.prefetchCount().pipe(catchError(() => of(0))),
          this.dashboardService.prefetchSummary().pipe(catchError(() => of(false))),
          this.leaveService.prefetchBalance().pipe(catchError(() => of(false)))
        ]).subscribe();

        // Navigate directly to dashboard
        this.router.navigate(['/dashboard']);
      })
    );
  }

  logout(): void {
    this.authStore.clearSession();
    this.router.navigate(['/auth/login']);
  }

  restoreSession(): Observable<boolean> {
    // App-boot silent refresh stub (will be wired to refresh endpoint)
    return of(false);
  }
}
