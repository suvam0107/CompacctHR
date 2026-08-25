// src/app/core/version/chunk-error.handler.spec.ts
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChunkErrorHandler } from './chunk-error.handler';
import { VersionUpdateService } from './version-update.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('ChunkErrorHandler', () => {
  let handler: ChunkErrorHandler;
  let versionService: VersionUpdateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChunkErrorHandler,
        VersionUpdateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    handler = TestBed.inject(ChunkErrorHandler);
    versionService = TestBed.inject(VersionUpdateService);
  });

  it('should detect chunk load error and trigger version check', () => {
    const checkSpy = vi.spyOn(versionService, 'checkForUpdate').mockImplementation(() => {});
    const chunkError = new Error('Loading chunk 42 failed.');

    handler.handleError(chunkError);

    expect(checkSpy).toHaveBeenCalled();
  });

  it('should log regular non-chunk error to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const regularError = new Error('Normal application runtime error');

    handler.handleError(regularError);

    expect(consoleSpy).toHaveBeenCalledWith('[Unhandled Error]', regularError);
  });
});
