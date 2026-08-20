// src/app/features/dashboard/pages/dashboard-home/dashboard-home.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppShellStore } from '../../../../core/state/app-shell.store';
import { AuthStore } from '../../../../core/auth/auth.store';
import { DashboardService } from '../../services/dashboard.service';
import { LeaveService } from '../../services/leave.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { AttendanceWidget } from '../../components/attendance-widget/attendance-widget';
import { LeaveWidget } from '../../components/leave-widget/leave-widget';
import { AnnouncementsWidget } from '../../components/announcements-widget/announcements-widget';
import { LoadingSkeleton } from '../../../../shared/components/loading-skeleton/loading-skeleton';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeader,
    StatCard,
    AttendanceWidget,
    LeaveWidget,
    AnnouncementsWidget,
    LoadingSkeleton
  ],
  templateUrl: './dashboard-home.html',
  styleUrls: ['./dashboard-home.scss']
})
export class DashboardHome implements OnInit {
  private shellStore = inject(AppShellStore);
  private authStore = inject(AuthStore);
  private dashboardService = inject(DashboardService);
  private leaveService = inject(LeaveService);

  readonly user = this.authStore.user;
  readonly summary = this.dashboardService.summary;
  readonly leaveBalances = this.leaveService.balances;
  readonly isDashboardLoading = this.dashboardService.isLoading;
  readonly isLeaveLoading = this.leaveService.isLoading;

  ngOnInit(): void {
    this.shellStore.setBreadcrumbs([{ label: 'Dashboard' }]);

    // If summary or leave balances are not populated, fetch them
    if (!this.summary()) {
      this.dashboardService.prefetchSummary().subscribe();
    }
    if (this.leaveBalances().length === 0) {
      this.leaveService.prefetchBalance().subscribe();
    }
  }
}
