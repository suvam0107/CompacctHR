// src/app/core/auth/auth.store.ts
import { Injectable, computed, signal } from '@angular/core';
import { User } from './models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private _user = signal<User | null>(null);
  private _permissions = signal<Set<string>>(new Set());
  private _accessToken = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly permissions = this._permissions.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();

  setToken(token: string): void {
    this._accessToken.set(token);
  }

  setSession(user: User, permissions: string[]): void {
    this._user.set(user);
    this._permissions.set(new Set(permissions));
  }

  hasPermission(permission: string): boolean {
    return this._permissions().has(permission);
  }

  hasRole(role: string): boolean {
    return this._user()?.roles.includes(role) ?? false;
  }

  clearSession(): void {
    this._user.set(null);
    this._permissions.set(new Set());
    this._accessToken.set(null);
  }
}
