// src/app/features/employees/components/employee-card/employee-card.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Avatar } from '../../../../shared/components/avatar/avatar';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { EmployeeListItem } from '../../models/employee.model';

@Component({
  selector: 'app-employee-card',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, Avatar, StatusBadge],
  templateUrl: './employee-card.html',
  styleUrls: ['./employee-card.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeCard {
  @Input({ required: true }) employee!: EmployeeListItem;
  @Output() viewDetail = new EventEmitter<EmployeeListItem>();

  onCardClick(): void {
    this.viewDetail.emit(this.employee);
  }
}
