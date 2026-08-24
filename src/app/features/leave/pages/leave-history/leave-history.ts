// src/app/features/leave/pages/leave-history/leave-history.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { DataTable, DataTableColumn } from '../../../../shared/components/data-table/data-table';
import { LeaveService } from '../../services/leave.service';

@Component({
  selector: 'app-leave-history',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, PageHeader, DataTable],
  templateUrl: './leave-history.html',
  styleUrls: ['./leave-history.scss']
})
export class LeaveHistory implements OnInit {
  protected leaveService = inject(LeaveService);

  columns: DataTableColumn[] = [
    { field: 'leaveTypeName', header: 'Leave Type', width: '150px', sortable: true },
    { field: 'fromDate', header: 'From Date', width: '130px', type: 'date', sortable: true },
    { field: 'toDate', header: 'To Date', width: '130px', type: 'date', sortable: true },
    { field: 'days', header: 'Days', width: '90px', align: 'center', sortable: true },
    { field: 'reason', header: 'Reason' },
    { field: 'status', header: 'Status', width: '120px', type: 'status', align: 'center', sortable: true },
    { field: 'appliedAt', header: 'Applied On', width: '130px', type: 'date' },
    { field: 'remarks', header: 'Approver Remarks' }
  ];

  ngOnInit(): void {
    this.leaveService.loadHistory().subscribe();
  }
}
