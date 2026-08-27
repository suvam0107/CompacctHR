// src/app/features/dashboard/pages/dashboard-home/dashboard-home.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppShellStore } from '../../../../core/state/app-shell.store';
import { PageHeader } from '../../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeader
  ],
  templateUrl: './dashboard-home.html',
  styleUrls: ['./dashboard-home.scss']
})
export class DashboardHome implements OnInit {
  private shellStore = inject(AppShellStore);

  ngOnInit(): void {
    this.shellStore.setBreadcrumbs([{ label: 'Dashboard' }]);
  }
}
