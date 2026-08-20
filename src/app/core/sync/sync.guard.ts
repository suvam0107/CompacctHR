// src/app/core/sync/sync.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { SyncStore } from './sync.store';

export const syncGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const syncStore = inject(SyncStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  if (syncStore.isSynced()) {
    return true;
  }

  return router.createUrlTree(['/sync'], {
    queryParams: { returnUrl: state.url !== '/' ? state.url : '/dashboard' }
  });
};
