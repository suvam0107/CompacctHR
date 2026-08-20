// src/app/layout/breadcrumb/breadcrumb.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppShellStore } from '../../core/state/app-shell.store';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumb.html',
  styleUrls: ['./breadcrumb.scss']
})
export class BreadcrumbComponent {
  private shellStore = inject(AppShellStore);
  readonly breadcrumbs = this.shellStore.breadcrumbs;
}
