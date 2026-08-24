// src/app/core/sync/sync.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SyncStore } from './sync.store';

/**
 * Functional CanActivateFn guard for Shell routes.
 * Redirects to /sync if application warm-up is not completed.
 */
export const syncGuard: CanActivateFn = (_route, state) => {
  const syncStore = inject(SyncStore);
  const router = inject(Router);

  if (syncStore.isSynced()) {
    return true;
  }

  // Redirect to /sync with current target URL as returnUrl query param
  return router.createUrlTree(['/sync'], {
    queryParams: { returnUrl: state.url }
  });
};
