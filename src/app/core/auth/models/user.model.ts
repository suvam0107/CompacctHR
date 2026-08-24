// src/app/core/auth/models/user.model.ts

export interface User {
  userHash: string;
  userName: string;
  userDisplayName: string;
  userPhone?: string | null;
  name: string;
  email: string;
  roles: string[];
  avatarUrl?: string | null;
}
