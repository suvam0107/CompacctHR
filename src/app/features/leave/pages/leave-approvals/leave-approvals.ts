// src/app/features/leave/pages/leave-approvals/leave-approvals.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { DataTable, DataTableColumn } from '../../../../shared/components/data-table/data-table';
import { LeaveService } from '../../services/leave.service';
import { LeaveApprovalItem } from '../../models/leave.model';

@Component({
  selector: 'app-leave-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule, PageHeader, DataTable],
  templateUrl: './leave-approvals.html',
  styleUrls: ['./leave-approvals.scss']
})
export class LeaveApprovals implements OnInit {
  protected leaveService = inject(LeaveService);

  showActionDialog = signal<boolean>(false);
  actionType = signal<'approve' | 'reject'>('approve');
  selectedLeave = signal<LeaveApprovalItem | null>(null);
  remarks = signal<string>('');
  isProcessing = signal<boolean>(false);

  columns: DataTableColumn[] = [
    { field: 'employeeName', header: 'Employee', sortable: true },
    { field: 'leaveTypeName', header: 'Type', width: '130px' },
    { field: 'fromDate', header: 'From', width: '120px', type: 'date', sortable: true },
    { field: 'toDate', header: 'To', width: '120px', type: 'date', sortable: true },
    { field: 'days', header: 'Days', width: '80px', align: 'center' },
    { field: 'reason', header: 'Reason' },
    { field: 'status', header: 'Status', width: '110px', type: 'status', align: 'center' }
  ];

  ngOnInit(): void {
    this.leaveService.loadApprovals().subscribe();
  }

  openApprovalModal(item: LeaveApprovalItem, type: 'approve' | 'reject'): void {
    this.selectedLeave.set(item);
    this.actionType.set(type);
    this.remarks.set('');
    this.showActionDialog.set(true);
  }

  confirmAction(): void {
    const leave = this.selectedLeave();
    if (!leave) return;

    this.isProcessing.set(true);
    const req$ = this.actionType() === 'approve'
      ? this.leaveService.approveLeave(leave.id, this.remarks())
      : this.leaveService.rejectLeave(leave.id, this.remarks());

    req$.subscribe(() => {
      this.isProcessing.set(false);
      this.showActionDialog.set(false);
      this.leaveService.loadApprovals().subscribe();
    });
  }
}
