// src/app/core/version/version-update.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VersionUpdateService } from './version-update.service';

describe('VersionUpdateService', () => {
  let service: VersionUpdateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VersionUpdateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    service = TestBed.inject(VersionUpdateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should initialize with current version signals', () => {
    expect(service.currentVersion().version).toBeDefined();
    expect(service.updateAvailable()).toBe(false);
    expect(service.showBanner()).toBe(false);
  });

  it('should set updateAvailable to true when new version is returned', () => {
    service.checkForUpdate();

    const req = httpMock.expectOne((r) => r.url.startsWith('/version.json'));
    expect(req.request.method).toBe('GET');
    req.flush({
      version: '99.0.0',
      commitHash: 'newhash123',
      buildTime: '2026-08-25T12:00:00Z'
    });

    expect(service.updateAvailable()).toBe(true);
    expect(service.showBanner()).toBe(true);
    expect(service.latestVersion()?.version).toBe('99.0.0');
  });

  it('should hide banner when snoozed', () => {
    service.checkForUpdate();

    const req = httpMock.expectOne((r) => r.url.startsWith('/version.json'));
    req.flush({
      version: '99.0.0',
      commitHash: 'newhash123',
      buildTime: '2026-08-25T12:00:00Z'
    });

    expect(service.showBanner()).toBe(true);

    service.snoozeUpdate(1000);

    expect(service.showBanner()).toBe(false);
  });
});
