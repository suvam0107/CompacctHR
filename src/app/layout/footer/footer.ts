// src/app/layout/footer/footer.ts
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VersionUpdateService } from '../../core/version/version-update.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Footer {
  readonly currentYear = new Date().getFullYear();
  readonly versionService = inject(VersionUpdateService);

  updateApp(): void {
    this.versionService.applyUpdate();
  }
}
