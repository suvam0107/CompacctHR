// src/app/core/auth/models/auth-response.model.ts
import { User } from './user.model';

export interface AuthLoginResponse {
  accessToken: string;
}

export interface AuthSessionResponse {
  user: User;
  permissions: string[];
  menuFlags: Record<string, boolean>;
}
