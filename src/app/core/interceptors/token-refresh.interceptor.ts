// src/app/core/interceptors/token-refresh.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn, HttpContextToken, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth.store';
import { APIResponse } from '../api/api-response.model';
import { AuthLoginResponse } from '../auth/models/auth-response.model';
import { environment } from '../../../environments/environment';

export const SKIP_TOKEN_REFRESH = new HttpContextToken<boolean>(() => false);

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const http = inject(HttpClient);

  if (req.context.get(SKIP_TOKEN_REFRESH) || req.url.includes('/assets/')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return http.post<APIResponse<AuthLoginResponse>>(`${environment.apiBase}/auth/refresh`, {}, {
            withCredentials: true
          }).pipe(
            switchMap(refreshRes => {
              isRefreshing = false;
              if (refreshRes.success && refreshRes.data?.accessToken) {
                const newToken = refreshRes.data.accessToken;
                authStore.setToken(newToken);
                refreshTokenSubject.next(newToken);

                const replayedReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${newToken}` }
                });
                return next(replayedReq);
              } else {
                authStore.clearSession();
                router.navigate(['/auth/login']);
                return throwError(() => error);
              }
            }),
            catchError(refreshErr => {
              isRefreshing = false;
              authStore.clearSession();
              router.navigate(['/auth/login']);
              return throwError(() => refreshErr);
            })
          );
        } else {
          return refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap(token => {
              const replayedReq = req.clone({
                setHeaders: { Authorization: `Bearer ${token}` }
              });
              return next(replayedReq);
            })
          );
        }
      }

      return throwError(() => error);
    })
  );
};
