// src/app/features/payroll/pages/salary-structure/salary-structure.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { LoadingSkeleton } from '../../../../shared/components/loading-skeleton/loading-skeleton';
import { CurrencyPipe } from '../../../../shared/pipes/currency.pipe';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { PayrollService } from '../../services/payroll.service';

@Component({
  selector: 'app-salary-structure',
  standalone: true,
  imports: [CommonModule, ButtonModule, PageHeader, LoadingSkeleton, CurrencyPipe, DateFormatPipe],
  templateUrl: './salary-structure.html',
  styleUrls: ['./salary-structure.scss']
})
export class SalaryStructure implements OnInit {
  protected payrollService = inject(PayrollService);

  ngOnInit(): void {
    this.payrollService.loadSalaryStructure().subscribe();
  }
}
