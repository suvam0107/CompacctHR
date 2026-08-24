// src/app/features/leave/components/leave-balance-card/leave-balance-card.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaveBalanceItem } from '../../models/leave.model';

@Component({
  selector: 'app-leave-balance-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leave-balance-card.html',
  styleUrls: ['./leave-balance-card.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeaveBalanceCard {
  @Input({ required: true }) balance!: LeaveBalanceItem;
}
