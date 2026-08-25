// src/app/core/version/version-update.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter, throttleTime } from 'rxjs';
import { VersionInfo } from './models/version-info.model';
import { environment } from '../../../environments/environment';
import { SKIP_LOADING_INDICATOR } from '../interceptors/loading.interceptor';

@Injectable({ providedIn: 'root' })
export class VersionUpdateService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly _currentVersion = signal<VersionInfo>({
    version: environment.appVersion || '1.0.0',
    commitHash: '',
    buildTime: ''
  });

  private readonly _latestVersion = signal<VersionInfo | null>(null);
  private readonly _isChecking = signal<boolean>(false);
  private readonly _isSnoozed = signal<boolean>(false);

  readonly currentVersion = this._currentVersion.asReadonly();
  readonly latestVersion = this._latestVersion.asReadonly();
  readonly isChecking = this._isChecking.asReadonly();

  readonly updateAvailable = computed(() => {
    const latest = this._latestVersion();
    const current = this._currentVersion();
    if (!latest) return false;

    // Check version string mismatch or commit hash mismatch
    const versionMismatch = latest.version !== current.version && latest.version !== '0.0.0';
    const hashMismatch = !!latest.commitHash && !!current.commitHash && latest.commitHash !== current.commitHash;

    return versionMismatch || hashMismatch;
  });

  readonly showBanner = computed(() => this.updateAvailable() && !this._isSnoozed());

  private snoozeTimeoutId: any = null;

  init(): void {
    // Initial fetch to get exact running version metadata
    this.fetchVersionInfo((info) => {
      this._currentVersion.set(info);
    });

    // Start periodic background polling
    const intervalMs = environment.versionCheckIntervalMs || 15 * 60 * 1000;
    setInterval(() => {
      this.checkForUpdate();
    }, intervalMs);

    // Also check on router navigation (throttled to at most once per 5 minutes)
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        throttleTime(5 * 60 * 1000)
      )
      .subscribe(() => {
        this.checkForUpdate();
      });
  }

  checkForUpdate(onComplete?: (hasUpdate: boolean) => void): void {
    if (this._isChecking()) return;
    this._isChecking.set(true);

    this.fetchVersionInfo(
      (latest) => {
        this._latestVersion.set(latest);
        this._isChecking.set(false);
        if (onComplete) {
          onComplete(this.updateAvailable());
        }
      },
      () => {
        this._isChecking.set(false);
        if (onComplete) {
          onComplete(false);
        }
      }
    );
  }

  snoozeUpdate(durationMs: number = 60 * 60 * 1000): void {
    this._isSnoozed.set(true);
    if (this.snoozeTimeoutId) {
      clearTimeout(this.snoozeTimeoutId);
    }
    this.snoozeTimeoutId = setTimeout(() => {
      this._isSnoozed.set(false);
    }, durationMs);
  }

  applyUpdate(): void {
    window.location.reload();
  }

  private fetchVersionInfo(onSuccess: (info: VersionInfo) => void, onError?: () => void): void {
    const url = `/version.json?t=${Date.now()}`;
    const context = new HttpContext().set(SKIP_LOADING_INDICATOR, true);

    this.http.get<VersionInfo>(url, { context }).subscribe({
      next: (info) => {
        if (info && info.version) {
          onSuccess(info);
        }
      },
      error: () => {
        if (onError) onError();
      }
    });
  }
}
