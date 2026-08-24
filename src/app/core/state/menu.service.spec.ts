// src/app/core/state/menu.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { MenuService } from './menu.service';
import { AuthStore } from '../auth/auth.store';

describe('MenuService', () => {
  let menuService: MenuService;
  let authStore: AuthStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MenuService, AuthStore]
    });

    menuService = TestBed.inject(MenuService);
    authStore = TestBed.inject(AuthStore);
  });

  it('should include dashboard for any user', () => {
    authStore.setSession(
      { userHash: 'usr_001', userName: 'emp', userDisplayName: 'Employee', name: 'Employee', email: 'emp@compacct.in', roles: ['Employee'] },
      []
    );

    const visible = menuService.visibleMenu();
    const dashboardItem = visible.find(i => i.id === 'dashboard');
    expect(dashboardItem).toBeDefined();
  });

  it('should show employee menu only when user has employee:view permission', () => {
    authStore.setSession(
      { userHash: 'usr_001', userName: 'emp', userDisplayName: 'Employee', name: 'Employee', email: 'emp@compacct.in', roles: ['Employee'] },
      ['employee:view']
    );

    let visible = menuService.visibleMenu();
    expect(visible.some(i => i.id === 'employees')).toBe(true);

    authStore.setSession(
      { userHash: 'usr_001', userName: 'emp', userDisplayName: 'Employee', name: 'Employee', email: 'emp@compacct.in', roles: ['Employee'] },
      []
    );

    visible = menuService.visibleMenu();
    expect(visible.some(i => i.id === 'employees')).toBe(false);
  });

  it('should show admin section only for SuperAdmin role', () => {
    authStore.setSession(
      { userHash: 'usr_admin', userName: 'admin', userDisplayName: 'Admin', name: 'Admin', email: 'admin@compacct.in', roles: ['SuperAdmin'] },
      ['employee:view']
    );

    const visible = menuService.visibleMenu();
    expect(visible.some(i => i.id === 'admin')).toBe(true);
  });
});
