// src/app/layout/header/header.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppShellStore } from '../../core/state/app-shell.store';
import { AuthStore } from '../../core/auth/auth.store';
import { AuthService } from '../../core/auth/auth.service';
import { InitialsPipe } from '../../shared/pipes/initials.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, InitialsPipe],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header {
  private shellStore = inject(AppShellStore);
  private authStore = inject(AuthStore);
  private authService = inject(AuthService);

  readonly user = this.authStore.user;
  readonly sidebarCollapsed = this.shellStore.sidebarCollapsed;

  isUserMenuOpen = signal<boolean>(false);

  toggleSidebar(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      this.shellStore.toggleMobileSidebar();
    } else {
      this.shellStore.toggleSidebar();
    }
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(open => !open);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  logout(): void {
    this.closeUserMenu();
    this.authService.logout();
  }
}
