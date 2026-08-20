// src/app/shared/components/empty-state/empty-state.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.html',
  styleUrls: ['./empty-state.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyState {
  @Input() icon: string = 'pi pi-inbox';
  @Input() title: string = 'No data available';
  @Input() message?: string;
  @Input() actionLabel?: string;
  @Output() action = new EventEmitter<void>();
}
