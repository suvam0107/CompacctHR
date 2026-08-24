// src/app/features/admin/pages/user-management/user-management.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { DataTable, DataTableColumn } from '../../../../shared/components/data-table/data-table';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ButtonModule, PageHeader, DataTable, StatusBadge],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.scss']
})
export class UserManagement implements OnInit {
  protected adminService = inject(AdminService);

  columns: DataTableColumn[] = [
    { field: 'name', header: 'User Name', sortable: true },
    { field: 'email', header: 'Email Address', sortable: true },
    { field: 'roles', header: 'Assigned Roles', type: 'custom' },
    { field: 'isActive', header: 'Status', width: '120px', type: 'custom', align: 'center' },
    { field: 'lastLogin', header: 'Last Login', width: '140px', type: 'date' }
  ];

  ngOnInit(): void {
    this.adminService.loadUsers().subscribe();
  }
}
