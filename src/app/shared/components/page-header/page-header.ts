// src/app/shared/components/page-header/page-header.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent],
  templateUrl: './page-header.html',
  styleUrls: ['./page-header.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeader {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
}

