// src/app/shared/components/loading-skeleton/loading-skeleton.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-skeleton.html',
  styleUrls: ['./loading-skeleton.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSkeleton {
  @Input() rows: number = 3;
  @Input() height: string = '20px';
  @Input() type: 'table' | 'card' | 'text' = 'text';

  get rowArray(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }
}
