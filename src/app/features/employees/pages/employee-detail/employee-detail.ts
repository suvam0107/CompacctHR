// src/app/features/employees/pages/employee-detail/employee-detail.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { Avatar } from '../../../../shared/components/avatar/avatar';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { LoadingSkeleton } from '../../../../shared/components/loading-skeleton/loading-skeleton';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { CurrencyPipe } from '../../../../shared/pipes/currency.pipe';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    TabsModule,
    PageHeader,
    Avatar,
    StatusBadge,
    LoadingSkeleton,
    DateFormatPipe,
    CurrencyPipe,
    HasPermissionDirective
  ],
  templateUrl: './employee-detail.html',
  styleUrls: ['./employee-detail.scss']
})
export class EmployeeDetail implements OnInit {
  protected employeeService = inject(EmployeeService);
  private route = inject(ActivatedRoute);

  employeeId = signal<number>(1);
  activeTab = signal<string>('personal');

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? parseInt(idParam, 10) : 1;
    this.employeeId.set(id);
    this.employeeService.getEmployeeDetail(id).subscribe();
  }
}
