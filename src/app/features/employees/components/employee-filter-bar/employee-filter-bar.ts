// src/app/features/employees/components/employee-filter-bar/employee-filter-bar.ts
import { Component, Output, EventEmitter, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { LookupCacheService } from '../../../../core/state/lookup-cache.service';
import { SearchInput } from '../../../../shared/components/search-input/search-input';
import { EmployeeFilterParams } from '../../models/employee.model';
import { DropdownOption } from '../../../../shared/models/dropdown-option.model';

@Component({
  selector: 'app-employee-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, ButtonModule, SearchInput],
  templateUrl: './employee-filter-bar.html',
  styleUrls: ['./employee-filter-bar.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeFilterBar {
  private lookupCache = inject(LookupCacheService);

  @Output() filterChange = new EventEmitter<EmployeeFilterParams>();
  @Output() reset = new EventEmitter<void>();

  departmentOptions = this.lookupCache.departments;
  designationOptions = this.lookupCache.designations;

  statusOptions: DropdownOption<string>[] = [
    { label: 'All Statuses', value: '' },
    { label: 'Active', value: 'Active' },
    { label: 'On Leave', value: 'OnLeave' },
    { label: 'Inactive', value: 'Inactive' }
  ];

  selectedDepartmentId = signal<number | null>(null);
  selectedDesignationId = signal<number | null>(null);
  selectedStatus = signal<string>('');
  searchTerm = signal<string>('');

  onDepartmentChange(val: number | null): void {
    this.selectedDepartmentId.set(val);
    this.emitChange();
  }

  onDesignationChange(val: number | null): void {
    this.selectedDesignationId.set(val);
    this.emitChange();
  }

  onStatusChange(val: string): void {
    this.selectedStatus.set(val);
    this.emitChange();
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.emitChange();
  }

  onReset(): void {
    this.selectedDepartmentId.set(null);
    this.selectedDesignationId.set(null);
    this.selectedStatus.set('');
    this.searchTerm.set('');
    this.reset.emit();
    this.emitChange();
  }

  private emitChange(): void {
    this.filterChange.emit({
      departmentId: this.selectedDepartmentId(),
      designationId: this.selectedDesignationId(),
      status: this.selectedStatus() || null,
      search: this.searchTerm() || ''
    });
  }
}
