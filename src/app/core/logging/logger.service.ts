// src/app/core/logging/logger.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  log(message: string, ...optionalParams: unknown[]): void {
    if (!environment.production) {
      console.log(`[CompacctHR] ${message}`, ...optionalParams);
    }
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    if (!environment.production) {
      console.debug(`[CompacctHR:DEBUG] ${message}`, ...optionalParams);
    }
  }

  info(message: string, ...optionalParams: unknown[]): void {
    if (!environment.production) {
      console.info(`[CompacctHR:INFO] ${message}`, ...optionalParams);
    }
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    console.warn(`[CompacctHR] ${message}`, ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    console.error(`[CompacctHR] ${message}`, ...optionalParams);
    // Remote error logging can be dispatched here in production
  }
}
