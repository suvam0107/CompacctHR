// src/app/core/state/menu.service.ts
import { Injectable, computed, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuthStore } from '../auth/auth.store';
import { MenuItem, MENU_ITEMS } from '../config/menu';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private authStore = inject(AuthStore);

  /**
   * Filter menu items recursively based on user permissions and roles
   */
  readonly visibleMenu = computed<MenuItem[]>(() => {
    const permissions = this.authStore.permissions();
    const user = this.authStore.user();
    const roles = user?.roles ?? [];

    const filterItem = (item: MenuItem): MenuItem | null => {
      // Check role constraint if present
      if (item.roles && item.roles.length > 0) {
        const hasRole = item.roles.some(r => roles.includes(r));
        if (!hasRole) {
          return null;
        }
      }

      // Check permission constraint if present
      if (item.permission && !permissions.has(item.permission)) {
        return null;
      }

      // Handle children recursively
      if (item.children && item.children.length > 0) {
        const visibleChildren = item.children
          .map(child => filterItem(child))
          .filter((child): child is MenuItem => child !== null)
          .sort((a, b) => a.order - b.order);

        // If all children were filtered out and this item has no direct route, omit it
        if (visibleChildren.length === 0 && !item.route) {
          return null;
        }

        return {
          ...item,
          children: visibleChildren
        };
      }

      return item;
    };

    return MENU_ITEMS
      .map(item => filterItem(item))
      .filter((item): item is MenuItem => item !== null)
      .sort((a, b) => a.order - b.order);
  });

  warmUp(): Observable<boolean> {
    // Menu calculation is synchronous and signal-derived from AuthStore;
    // this warmUp task verifies that the user session is loaded.
    return of(true);
  }
}
