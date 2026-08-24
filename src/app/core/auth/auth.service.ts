// src/app/core/auth/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, switchMap, tap, map, of, throwError, forkJoin, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
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
        // Trigger background prefetching for lookup & summary data
        this.lookupCache.warmUp().subscribe();
        this.notifService.prefetchCount().subscribe();
        this.dashboardService.prefetchSummary().subscribe();
        this.leaveService.prefetchBalance().subscribe();

        // Route to home screen / dashboard
        this.router.navigate(['/dashboard']);
      })
    );
  }

  logout(): void {
    this.authStore.clearSession();
    this.router.navigate(['/auth/login']);
  }

  restoreSession(): Observable<boolean> {
    if (environment.useMockData) {
      return of(false);
    }

    return this.api.callNested<AuthSessionResponse>(SPC.AUTH_ME).pipe(
      tap(sessionRes => {
        if (sessionRes.success && sessionRes.data?.user) {
          this.authStore.setSession(sessionRes.data.user, sessionRes.data.permissions ?? []);
        }
      }),
      map(sessionRes => !!(sessionRes.success && sessionRes.data?.user)),
      catchError(() => {
        this.authStore.clearSession();
        return of(false);
      })
    );
  }
}

