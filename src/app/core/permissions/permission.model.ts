// src/app/core/permissions/permission.model.ts

export type UserRole = 'Employee' | 'Manager' | 'HRAdmin' | 'SuperAdmin';

export const Permissions = {
  // Employee module
  EMPLOYEE_VIEW: 'employee:view',
  EMPLOYEE_CREATE: 'employee:create',
  EMPLOYEE_EDIT: 'employee:edit',
  EMPLOYEE_DELETE: 'employee:delete',

  // Attendance module
  ATTENDANCE_VIEW: 'attendance:view',
  ATTENDANCE_REGULARIZE: 'attendance:regularize',
  ATTENDANCE_APPROVE: 'attendance:approve',

  // Leave module
  LEAVE_VIEW: 'leave:view',
  LEAVE_APPLY: 'leave:apply',
  LEAVE_APPROVE: 'leave:approve',
  LEAVE_MANAGE: 'leave:manage',

  // Payroll module
  PAYROLL_VIEW: 'payroll:view',
  PAYROLL_PROCESS: 'payroll:process',
  PAYROLL_MANAGE: 'payroll:manage',

  // Profile module
  PROFILE_VIEW: 'profile:view',
  PROFILE_EDIT: 'profile:edit',

  // Admin module
  ADMIN_ACCESS: 'admin:access',
  ADMIN_USERS: 'admin:users',
  ADMIN_ROLES: 'admin:roles',
  ADMIN_SETTINGS: 'admin:settings',
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions] | string;
