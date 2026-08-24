// src/app/features/profile/profile.routes.ts
import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/my-profile/my-profile').then(m => m.MyProfile)
  }
];
