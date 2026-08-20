// src/app/core/interceptors/error.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { getErrorMessage } from '../api/error-code-map';
import { LoggerService } from '../logging/logger.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService, { optional: true });
  const logger = inject(LoggerService);

  return next(req).pipe(
    catchError((error: unknown) => {
      let errorMessage = 'An unexpected error occurred.';

      if (error instanceof HttpErrorResponse) {
        if (error.status === 0) {
          errorMessage = getErrorMessage('NETWORK_ERROR');
        } else if (error.error?.errorCode) {
          errorMessage = getErrorMessage(error.error.errorCode);
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else {
          errorMessage = `Server error (${error.status}): ${error.statusText || 'Unknown error'}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      logger.error('HTTP Request failed', { url: req.url, error });

      messageService?.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 5000
      });

      return throwError(() => error);
    })
  );
};
