// src/app/core/auth/models/user.model.ts

export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  avatarUrl?: string | null;
}
