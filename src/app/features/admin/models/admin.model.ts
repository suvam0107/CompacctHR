// src/app/features/admin/models/admin.model.ts

export interface AdminUserItem {
  id: number;
  employeeId: number;
  name: string;
  email: string;
  roles: string[];
  isActive: boolean;
  lastLogin: string;
}

export interface AdminRoleItem {
  id: number;
  code: string;
  name: string;
  description: string;
  permissionCount: number;
}

export interface SystemSettingItem {
  key: string;
  category: string;
  label: string;
  value: string | boolean | number;
  description: string;
}
