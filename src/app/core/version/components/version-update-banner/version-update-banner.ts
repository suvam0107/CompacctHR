// src/app/core/version/components/version-update-banner/version-update-banner.ts
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VersionUpdateService } from '../../version-update.service';

@Component({
  selector: 'app-version-update-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './version-update-banner.html',
  styleUrls: ['./version-update-banner.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VersionUpdateBanner {
  readonly versionService = inject(VersionUpdateService);

  update(): void {
    this.versionService.applyUpdate();
  }

  snooze(): void {
    this.versionService.snoozeUpdate();
  }
}
