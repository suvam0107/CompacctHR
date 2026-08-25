// src/app/core/config/menu.ts

export interface MenuItem {
  id: string;
  label: string;
  icon: string;             // PrimeIcons class e.g. 'pi pi-home'
  route?: string;
  permission?: string;      // e.g. 'employee:view' — item hidden if user lacks it
  roles?: string[];         // optional additional role restriction
  children?: MenuItem[];
  order: number;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'pi pi-home',
    route: '/dashboard',
    order: 1
  },
  {
    id: 'employees',
    label: 'Employees',
    icon: 'pi pi-users',
    route: '/employees',
    permission: 'employee:view',
    order: 2
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: 'pi pi-clock',
    order: 3,
    permission: 'attendance:view',
    children: [
      { id: 'attendance-log', label: 'Attendance Log', icon: 'pi pi-list', route: '/attendance/log', order: 1 },
      {
        id: 'regularization',
        label: 'Regularization',
        icon: 'pi pi-refresh',
        route: '/attendance/regularization',
        permission: 'attendance:approve',
        order: 2
      }
    ]
  },
  {
    id: 'leave',
    label: 'Leave',
    icon: 'pi pi-calendar-minus',
    order: 4,
    permission: 'leave:view',
    children: [
      { id: 'leave-history', label: 'My Leave History', icon: 'pi pi-history', route: '/leave/history', order: 1 },
      {
        id: 'leave-approvals',
        label: 'Approvals',
        icon: 'pi pi-check-square',
        route: '/leave/approvals',
        permission: 'leave:approve',
        order: 2
      }
    ]
  },
  {
    id: 'payroll',
    label: 'Payroll',
    icon: 'pi pi-wallet',
    order: 5,
    permission: 'payroll:view',
    children: [
      { id: 'payslips', label: 'Payslips', icon: 'pi pi-file', route: '/payroll/payslips', order: 1 },
      {
        id: 'payroll-processing',
        label: 'Processing',
        icon: 'pi pi-cog',
        route: '/payroll/processing',
        permission: 'payroll:process',
        roles: ['HRAdmin', 'SuperAdmin'],
        order: 2
      }
    ]
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: 'pi pi-shield',
    order: 6,
    roles: ['SuperAdmin'],
    children: [
      { id: 'users', label: 'Users', icon: 'pi pi-user-edit', route: '/admin/users', order: 1 },
      { id: 'roles', label: 'Roles & Permissions', icon: 'pi pi-key', route: '/admin/roles', order: 2 }
    ]
  }
];
