// src/app/core/sync/sync.store.ts
import { Injectable, computed, signal } from '@angular/core';
import { SyncTask } from './sync-task-registry';

export type SyncStatus = 'pending' | 'done' | 'error';

export interface SyncTaskItem {
  id: string;
  label: string;
  critical: boolean;
  status: SyncStatus;
  errorMessage?: string;
}

@Injectable({ providedIn: 'root' })
export class SyncStore {
  private _tasks = signal<SyncTaskItem[]>([]);
  private _isSynced = signal<boolean>(false);
  private _isRunning = signal<boolean>(false);

  readonly tasks = this._tasks.asReadonly();
  readonly isSynced = this._isSynced.asReadonly();
  readonly isRunning = this._isRunning.asReadonly();

  readonly totalTasks = computed(() => this._tasks().length);

  readonly completedTasks = computed(() =>
    this._tasks().filter(t => t.status === 'done' || t.status === 'error').length
  );

  readonly overallProgress = computed(() => {
    const total = this._tasks().length;
    if (total === 0) return 0;
    const completed = this._tasks().filter(t => t.status === 'done' || t.status === 'error').length;
    return Math.round((completed / total) * 100);
  });

  readonly hasCriticalFailure = computed(() =>
    this._tasks().some(t => t.critical && t.status === 'error')
  );

  initialize(tasks: SyncTask[]): void {
    this._tasks.set(
      tasks.map(t => ({
        id: t.id,
        label: t.label,
        critical: t.critical,
        status: 'pending'
      }))
    );
    this._isSynced.set(false);
    this._isRunning.set(true);
  }

  updateTaskStatus(id: string, status: SyncStatus, errorMessage?: string): void {
    this._tasks.update(current =>
      current.map(task => (task.id === id ? { ...task, status, errorMessage } : task))
    );
  }

  setSynced(synced: boolean): void {
    this._isSynced.set(synced);
    this._isRunning.set(false);
  }

  reset(): void {
    this._tasks.set([]);
    this._isSynced.set(false);
    this._isRunning.set(false);
  }
}
