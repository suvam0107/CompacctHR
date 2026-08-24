// src/app/layout/shell/shell.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { AppShellStore } from '../../core/state/app-shell.store';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';
import { Footer } from '../footer/footer';
import { MENU_ITEMS, MenuItem } from '../../core/config/menu';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToastModule,
    ProgressBarModule,
    Header,
    Sidebar,
    Footer
  ],
  templateUrl: './shell.html',
  styleUrls: ['./shell.scss']
})
export class Shell implements OnInit, OnDestroy {
  private shellStore = inject(AppShellStore);
  private router = inject(Router);
  private sub?: Subscription;

  readonly isLoading = this.shellStore.isLoading;
  readonly sidebarCollapsed = this.shellStore.sidebarCollapsed;
  readonly mobileSidebarOpen = this.shellStore.mobileSidebarOpen;

  ngOnInit(): void {
    this.updateBreadcrumbs(this.router.url);

    this.sub = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(event => {
      this.updateBreadcrumbs(event.urlAfterRedirects || event.url);
    });
  }

  closeMobileSidebar(): void {
    this.shellStore.closeMobileSidebar();
  }

  private updateBreadcrumbs(url: string): void {
    const cleanUrl = url.split('?')[0];

    if (cleanUrl === '/notifications') {
      this.shellStore.setBreadcrumbs([{ label: 'Notifications', url: '/notifications' }]);
      return;
    }

    if (cleanUrl === '/profile') {
      this.shellStore.setBreadcrumbs([{ label: 'My Profile', url: '/profile' }]);
      return;
    }

    // Match against MENU_ITEMS
    for (const item of MENU_ITEMS) {
      if (item.route === cleanUrl) {
        this.shellStore.setBreadcrumbs([{ label: item.label, url: item.route }]);
        return;
      }

      if (item.children) {
        for (const child of item.children) {
          if (child.route === cleanUrl) {
            this.shellStore.setBreadcrumbs([
              { label: item.label },
              { label: child.label, url: child.route }
            ]);
            return;
          }
        }
      }
    }

    // Dynamic child routes fallback
    if (cleanUrl.startsWith('/employees/new')) {
      this.shellStore.setBreadcrumbs([
        { label: 'Employees', url: '/employees' },
        { label: 'Add Employee' }
      ]);
    } else if (cleanUrl.startsWith('/employees/')) {
      this.shellStore.setBreadcrumbs([
        { label: 'Employees', url: '/employees' },
        { label: 'Employee Profile' }
      ]);
    } else {
      this.shellStore.setBreadcrumbs([{ label: 'Dashboard', url: '/dashboard' }]);
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
