// src/app/core/sync/sync.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SyncStore } from './sync.store';
import { SyncService } from './sync.service';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-sync',
  standalone: true,
  imports: [CommonModule, ProgressBarModule, ButtonModule],
  templateUrl: './sync.html',
  styleUrl: './sync.scss'
})
export class Sync implements OnInit {
  protected syncStore = inject(SyncStore);
  private syncService = inject(SyncService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private returnUrl: string = '/dashboard';

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    this.startWarmUp();
  }

  startWarmUp(): void {
    this.syncService.run(this.returnUrl).subscribe();
  }

  onRetry(): void {
    this.startWarmUp();
  }

  onBackToLogin(): void {
    this.authService.logout();
  }
}
