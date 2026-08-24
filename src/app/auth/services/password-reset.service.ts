// src/app/auth/services/password-reset.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { APIService } from '../../core/api/api.service';
import { LoggerService } from '../../core/logging/logger.service';

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PasswordResetService {
  private api = inject(APIService);
  private logger = inject(LoggerService);

  requestPasswordReset(email: string): Observable<PasswordResetResponse> {
    this.logger.info(`PasswordResetService: Requesting password reset for ${email}`);

    // In mock mode / pre-gateway, return simulated success
    return of({
      success: true,
      message: `A password reset link has been dispatched to ${email}.`
    }).pipe(delay(600));
  }
}
