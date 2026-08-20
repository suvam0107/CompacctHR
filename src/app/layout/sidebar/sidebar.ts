// src/app/layout/sidebar/sidebar.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppShellStore } from '../../core/state/app-shell.store';
import { MenuService } from '../../core/state/menu.service';
import { MenuItem } from '../../core/config/menu';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class Sidebar {
  private shellStore = inject(AppShellStore);
  private menuService = inject(MenuService);

  readonly collapsed = this.shellStore.sidebarCollapsed;
  readonly mobileOpen = this.shellStore.mobileSidebarOpen;
  readonly menuItems = this.menuService.visibleMenu;

  // Track expanded parent submenus (all closed by default)
  private expandedMenus = signal<Set<string>>(new Set());

  isMenuExpanded(id: string): boolean {
    return this.expandedMenus().has(id);
  }

  onNavigate(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      this.shellStore.closeMobileSidebar();
    }
  }

  toggleSubmenu(id: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.collapsed() && (typeof window === 'undefined' || window.innerWidth > 768)) {
      // In desktop collapsed state, expanding any trigger opens the sidebar and reveals the clicked submenu
      this.shellStore.setSidebarCollapsed(false);
      this.expandedMenus.update(current => {
        const next = new Set(current);
        next.add(id);
        return next;
      });
      return;
    }

    // In expanded state, toggle the submenu
    this.expandedMenus.update(current => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }
}
