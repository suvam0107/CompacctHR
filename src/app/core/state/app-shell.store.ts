// src/app/core/state/app-shell.store.ts
import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppShellStore {
  private _loadingCount = signal<number>(0);
  private _sidebarCollapsed = signal<boolean>(false);
  private _mobileSidebarOpen = signal<boolean>(false);
  private _breadcrumbs = signal<{ label: string; url?: string }[]>([]);

  readonly loadingCount = this._loadingCount.asReadonly();
  readonly isLoading = computed(() => this._loadingCount() > 0);
  readonly sidebarCollapsed = this._sidebarCollapsed.asReadonly();
  readonly mobileSidebarOpen = this._mobileSidebarOpen.asReadonly();
  readonly breadcrumbs = this._breadcrumbs.asReadonly();

  incrementLoading(): void {
    this._loadingCount.update(count => count + 1);
  }

  decrementLoading(): void {
    this._loadingCount.update(count => Math.max(0, count - 1));
  }

  toggleSidebar(): void {
    this._sidebarCollapsed.update(c => !c);
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this._sidebarCollapsed.set(collapsed);
  }

  toggleMobileSidebar(): void {
    this._mobileSidebarOpen.update(o => !o);
  }

  setMobileSidebarOpen(open: boolean): void {
    this._mobileSidebarOpen.set(open);
  }

  closeMobileSidebar(): void {
    this._mobileSidebarOpen.set(false);
  }

  setBreadcrumbs(breadcrumbs: { label: string; url?: string }[]): void {
    this._breadcrumbs.set(breadcrumbs);
  }
}
