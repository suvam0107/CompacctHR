// src/app/layout/shell/shell.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { AppShellStore } from '../../core/state/app-shell.store';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';
import { Footer } from '../footer/footer';

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
export class Shell {
  private shellStore = inject(AppShellStore);

  readonly isLoading = this.shellStore.isLoading;
  readonly sidebarCollapsed = this.shellStore.sidebarCollapsed;
  readonly mobileSidebarOpen = this.shellStore.mobileSidebarOpen;

  closeMobileSidebar(): void {
    this.shellStore.closeMobileSidebar();
  }
}
