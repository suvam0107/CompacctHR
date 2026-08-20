// src/app/core/interceptors/loading.interceptor.ts
import { HttpInterceptorFn, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { AppShellStore } from '../state/app-shell.store';

export const SKIP_LOADING_INDICATOR = new HttpContextToken<boolean>(() => false);

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_LOADING_INDICATOR)) {
    return next(req);
  }

  const appShellStore = inject(AppShellStore);
  appShellStore.incrementLoading();

  return next(req).pipe(
    finalize(() => {
      appShellStore.decrementLoading();
    })
  );
};
