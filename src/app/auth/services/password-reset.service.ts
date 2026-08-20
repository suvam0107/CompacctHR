// src/app/auth/services/password-reset.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PasswordResetService {
  requestPasswordReset(email: string): Observable<boolean> {
    // Stub implementation returning true for mock development
    console.log(`[CompacctHR] Password reset requested for: ${email}`);
    return of(true);
  }
}
