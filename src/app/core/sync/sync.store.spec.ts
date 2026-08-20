// src/app/core/sync/sync.store.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SyncStore } from './sync.store';
import { SyncTask } from './sync-task-registry';
import { of } from 'rxjs';

describe('SyncStore', () => {
  let store: SyncStore;

  beforeEach(() => {
    store = new SyncStore();
  });

  it('should initialize tasks correctly', () => {
    const mockTasks: SyncTask[] = [
      { id: 'task1', label: 'Loading Task 1', critical: true, run: () => of(true) },
      { id: 'task2', label: 'Fetching Task 2', critical: false, run: () => of(true) }
    ];

    store.initialize(mockTasks);

    expect(store.totalTasks()).toBe(2);
    expect(store.completedTasks()).toBe(0);
    expect(store.overallProgress()).toBe(0);
    expect(store.isSynced()).toBe(false);
  });

  it('should calculate progress percentage accurately as tasks complete', () => {
    const mockTasks: SyncTask[] = [
      { id: 'task1', label: 'Task 1', critical: true, run: () => of(true) },
      { id: 'task2', label: 'Task 2', critical: false, run: () => of(true) }
    ];

    store.initialize(mockTasks);
    store.updateTaskStatus('task1', 'done');

    expect(store.completedTasks()).toBe(1);
    expect(store.overallProgress()).toBe(50);

    store.updateTaskStatus('task2', 'done');
    expect(store.completedTasks()).toBe(2);
    expect(store.overallProgress()).toBe(100);
  });

  it('should detect critical task failure', () => {
    const mockTasks: SyncTask[] = [
      { id: 'critical-task', label: 'Critical Task', critical: true, run: () => of(true) },
      { id: 'normal-task', label: 'Normal Task', critical: false, run: () => of(true) }
    ];

    store.initialize(mockTasks);
    store.updateTaskStatus('critical-task', 'error', 'Network error');

    expect(store.hasCriticalFailure()).toBe(true);
  });

  it('should not mark critical failure if only non-critical task errors', () => {
    const mockTasks: SyncTask[] = [
      { id: 'critical-task', label: 'Critical Task', critical: true, run: () => of(true) },
      { id: 'normal-task', label: 'Normal Task', critical: false, run: () => of(true) }
    ];

    store.initialize(mockTasks);
    store.updateTaskStatus('normal-task', 'error', 'Optional fetch failed');

    expect(store.hasCriticalFailure()).toBe(false);
  });
});
