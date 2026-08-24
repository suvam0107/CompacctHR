// src/app/features/employees/pages/employee-list/employee-list.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { DataTable, DataTableColumn } from '../../../../shared/components/data-table/data-table';
import { EmployeeFilterBar } from '../../components/employee-filter-bar/employee-filter-bar';
import { EmployeeCard } from '../../components/employee-card/employee-card';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeListItem, EmployeeFilterParams } from '../../models/employee.model';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    PageHeader,
    DataTable,
    EmployeeFilterBar,
    EmployeeCard,
    HasPermissionDirective
  ],
  templateUrl: './employee-list.html',
  styleUrls: ['./employee-list.scss']
})
export class EmployeeList implements OnInit {
  protected employeeService = inject(EmployeeService);
  private router = inject(Router);

  viewMode = signal<'table' | 'grid'>('table');

  columns: DataTableColumn[] = [
    { field: 'employeeCode', header: 'Emp Code', width: '110px', sortable: true },
    { field: 'name', header: 'Name', sortable: true },
    { field: 'email', header: 'Email', sortable: true },
    { field: 'departmentName', header: 'Department', sortable: true },
    { field: 'designationName', header: 'Designation', sortable: true },
    { field: 'status', header: 'Status', width: '120px', type: 'status', align: 'center', sortable: true },
    { field: 'joinDate', header: 'Join Date', width: '130px', type: 'date', sortable: true }
  ];

  ngOnInit(): void {
    this.employeeService.loadEmployees().subscribe();
  }

  onFilterChange(params: EmployeeFilterParams): void {
    this.employeeService.loadEmployees(params).subscribe();
  }

  onRowClick(employee: EmployeeListItem): void {
    this.router.navigate(['/employees', employee.id]);
  }

  toggleViewMode(mode: 'table' | 'grid'): void {
    this.viewMode.set(mode);
  }
}
