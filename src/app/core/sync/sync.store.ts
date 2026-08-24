// src/app/core/sync/sync.store.ts
import { Injectable, computed, signal } from '@angular/core';
import { SyncTask } from './sync-task-registry';

export type SyncItemStatus = 'pending' | 'running' | 'done' | 'error';

export interface SyncTaskState {
  id: string;
  label: string;
  critical: boolean;
  status: SyncItemStatus;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class SyncStore {
  private _tasks = signal<SyncTaskState[]>([]);
  private _isSynced = signal<boolean>(false);
  private _isSyncing = signal<boolean>(false);
  private _criticalError = signal<string | null>(null);

  readonly tasks = this._tasks.asReadonly();
  readonly isSynced = this._isSynced.asReadonly();
  readonly isSyncing = this._isSyncing.asReadonly();
  readonly criticalError = this._criticalError.asReadonly();

  readonly completedCount = computed(() => {
    return this._tasks().filter(t => t.status === 'done' || (t.status === 'error' && !t.critical)).length;
  });

  readonly totalCount = computed(() => this._tasks().length);

  readonly overallProgress = computed(() => {
    const total = this._tasks().length;
    if (total === 0) return 0;
    const completed = this._tasks().filter(t => t.status === 'done' || t.status === 'error').length;
    return Math.round((completed / total) * 100);
  });

  readonly hasCriticalFailure = computed(() => {
    return this._tasks().some(t => t.critical && t.status === 'error') || !!this._criticalError();
  });

  initTasks(registryTasks: SyncTask[]): void {
    this._tasks.set(
      registryTasks.map(t => ({
        id: t.id,
        label: t.label,
        critical: t.critical,
        status: 'pending'
      }))
    );
    this._isSynced.set(false);
    this._isSyncing.set(false);
    this._criticalError.set(null);
  }

  setSyncing(syncing: boolean): void {
    this._isSyncing.set(syncing);
  }

  updateTaskStatus(id: string, status: SyncItemStatus, error?: string): void {
    this._tasks.update(tasks =>
      tasks.map(t => (t.id === id ? { ...t, status, error } : t))
    );
  }

  setCriticalError(error: string): void {
    this._criticalError.set(error);
  }

  setSynced(synced: boolean): void {
    this._isSynced.set(synced);
    this._isSyncing.set(false);
  }

  reset(): void {
    this._tasks.set([]);
    this._isSynced.set(false);
    this._isSyncing.set(false);
    this._criticalError.set(null);
  }
}
