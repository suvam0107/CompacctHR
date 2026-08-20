// src/app/features/dashboard/components/leave-widget/leave-widget.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LeaveBalanceItem } from '../../models/leave.model';
import { LoadingSkeleton } from '../../../../shared/components/loading-skeleton/loading-skeleton';

@Component({
  selector: 'app-leave-widget',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSkeleton],
  templateUrl: './leave-widget.html',
  styleUrls: ['./leave-widget.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeaveWidget {
  @Input() balances: LeaveBalanceItem[] = [];
  @Input() isLoading: boolean = false;
}
