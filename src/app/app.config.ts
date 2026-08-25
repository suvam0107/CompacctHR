// src/app/app.config.ts
import { ApplicationConfig, ErrorHandler, provideZonelessChangeDetection, provideAppInitializer, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import { routes } from './app.routes';
import { CompacctHRPreset } from '../../theme/primeng-preset';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { tokenRefreshInterceptor } from './core/interceptors/token-refresh.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { ChunkErrorHandler } from './core/version/chunk-error.handler';
import { VersionUpdateService } from './core/version/version-update.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideAnimationsAsync(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        tokenRefreshInterceptor,
        loadingInterceptor,
        errorInterceptor
      ]),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN'
      })
    ),
    providePrimeNG({
      theme: {
        preset: CompacctHRPreset,
        options: {
          darkModeSelector: false || 'none'
        }
      },
      ripple: true
    }),
    MessageService,
    { provide: ErrorHandler, useClass: ChunkErrorHandler },
    provideAppInitializer(() => {
      inject(VersionUpdateService).init();
    })
  ]
};
