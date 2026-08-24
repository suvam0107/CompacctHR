// src/app/features/profile/services/profile.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, map, of, catchError } from 'rxjs';
import { APIService } from '../../../core/api/api.service';
import { SPC } from '../../../core/api/spc-registry';
import { LoggerService } from '../../../core/logging/logger.service';
import { ProfileData, ProfileUpdatePayload } from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private api = inject(APIService);
  private logger = inject(LoggerService);

  private _profile = signal<ProfileData | null>(null);
  private _isLoading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  readonly profile = this._profile.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  loadMyProfile(): Observable<ProfileData | null> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.callNested<ProfileData>(SPC.PROFILE_GET_MY).pipe(
      tap(res => {
        this._isLoading.set(false);
        if (res.success && res.data) {
          this._profile.set(res.data);
        }
      }),
      map(res => (res.success ? res.data : null)),
      catchError(err => {
        this._isLoading.set(false);
        this._error.set(err.message || 'Failed to load profile');
        this.logger.error('ProfileService.loadMyProfile failed', err);
        return of(null);
      })
    );
  }

  updateProfile(payload: ProfileUpdatePayload): Observable<boolean> {
    return this.api.callNonNested(SPC.PROFILE_UPDATE_MY, payload as unknown as Record<string, unknown>).pipe(
      map(res => !!res.success)
    );
  }
}
