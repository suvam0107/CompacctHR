// src/app/shared/components/stat-card/stat-card.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.html',
  styleUrls: ['./stat-card.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatCard {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input() icon?: string;
  @Input() trend?: 'up' | 'down' | 'flat';
  @Input() trendValue?: string;
  @Input() subtext?: string;
  @Input() colorVariant: 'primary' | 'success' | 'warning' | 'info' | 'danger' = 'primary';
}
