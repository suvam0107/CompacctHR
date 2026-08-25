// src/app/core/version/chunk-error.handler.ts
import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { VersionUpdateService } from './version-update.service';

@Injectable()
export class ChunkErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: any): void {
    const chunkFailedMessage = /Loading chunk [\d]+ failed|ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i;

    const isChunkError =
      error &&
      (chunkFailedMessage.test(error.message || '') ||
        chunkFailedMessage.test(error.name || '') ||
        chunkFailedMessage.test(String(error)));

    if (isChunkError) {
      console.warn('[ChunkErrorHandler] Detected lazy chunk loading failure. Server may have updated.', error);

      // Lazily resolve VersionUpdateService to avoid circular dependency during bootstrap
      try {
        const versionService = this.injector.get(VersionUpdateService);
        versionService.checkForUpdate((hasUpdate) => {
          if (hasUpdate) {
            versionService.applyUpdate();
          } else {
            // Force reload if chunk failed even if version matched (e.g. network glitch or cache issue)
            window.location.reload();
          }
        });
      } catch (e) {
        window.location.reload();
      }
      return;
    }

    // Default error handling for non-chunk errors
    console.error('[Unhandled Error]', error);
  }
}
