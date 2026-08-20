// src/app/core/sync/sync.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { SyncService } from './sync.service';
import { SyncStore } from './sync.store';

@Component({
  selector: 'app-sync',
  standalone: true,
  imports: [CommonModule, ProgressBarModule, ToastModule],
  templateUrl: './sync.html',
  styleUrls: ['./sync.scss']
})
export class Sync implements OnInit {
  private syncService = inject(SyncService);
  private syncStore = inject(SyncStore);
  private route = inject(ActivatedRoute);

  readonly tasks = this.syncStore.tasks;
  readonly progress = this.syncStore.overallProgress;

  ngOnInit(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    // Run sync outside current change detection tick to avoid ExpressionChangedAfterItHasBeenCheckedError
    queueMicrotask(() => {
      this.syncService.runSync(returnUrl).subscribe();
    });
  }
}
