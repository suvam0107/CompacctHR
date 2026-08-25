// src/app/features/admin/pages/role-management/role-management.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { DataTable, DataTableColumn } from '../../../../shared/components/data-table/data-table';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, ButtonModule, PageHeader, DataTable],
  templateUrl: './role-management.html',
  styleUrls: ['./role-management.scss']
})
export class RoleManagement implements OnInit {
  protected adminService = inject(AdminService);

  columns: DataTableColumn[] = [
    { field: 'code', header: 'Role Code', width: '150px', sortable: true, filterable: true },
    { field: 'name', header: 'Role Name', width: '200px', sortable: true },
    { field: 'description', header: 'Access Description' },
    { field: 'permissionCount', header: 'Granted Permissions', width: '160px', align: 'center', sortable: true }
  ];

  ngOnInit(): void {
    this.adminService.loadRoles().subscribe();
  }
}
