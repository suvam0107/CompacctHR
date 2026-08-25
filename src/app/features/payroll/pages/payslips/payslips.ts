// src/app/features/payroll/pages/payslips/payslips.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { DataTable, DataTableColumn } from '../../../../shared/components/data-table/data-table';
import { exportToPdf } from '../../../../shared/utils/pdf-export.util';
import { PayrollService } from '../../services/payroll.service';
import { PayslipListItem } from '../../models/payroll.model';

@Component({
  selector: 'app-payslips',
  standalone: true,
  imports: [CommonModule, ButtonModule, PageHeader, DataTable],
  templateUrl: './payslips.html',
  styleUrls: ['./payslips.scss']
})
export class Payslips implements OnInit {
  protected payrollService = inject(PayrollService);

  columns: DataTableColumn[] = [
    { field: 'period', header: 'Pay Period', sortable: true, filterable: true },
    { field: 'grossPay', header: 'Gross Earnings', type: 'currency', align: 'right', sortable: true },
    { field: 'deductions', header: 'Deductions', type: 'currency', align: 'right', sortable: true },
    { field: 'netPay', header: 'Net Salary', type: 'currency', align: 'right', sortable: true },
    {
      field: 'status',
      header: 'Status',
      width: '120px',
      type: 'status',
      align: 'center',
      sortable: true,
      filterable: true,
      filterOptions: [
        { label: 'Disbursed', value: 'Disbursed' },
        { label: 'Processing', value: 'Processing' },
        { label: 'Pending', value: 'Pending' }
      ]
    },
    { field: 'processedAt', header: 'Disbursed On', width: '130px', type: 'date' }
  ];

  ngOnInit(): void {
    this.payrollService.loadPayslips().subscribe();
  }

  downloadPayslip(item: PayslipListItem): void {
    exportToPdf(
      [
        { header: 'Component', key: 'label', width: '*' },
        { header: 'Type', key: 'type', width: '100' },
        { header: 'Amount (INR)', key: 'amount', width: '120', alignment: 'right' }
      ],
      [
        { label: 'Basic Salary', type: 'Earning', amount: '₹ 45,000.00' },
        { label: 'House Rent Allowance (HRA)', type: 'Earning', amount: '₹ 22,500.00' },
        { label: 'Special Allowance', type: 'Earning', amount: '₹ 17,500.00' },
        { label: 'Provident Fund (PF)', type: 'Deduction', amount: '₹ 4,800.00' },
        { label: 'Professional Tax (PT)', type: 'Deduction', amount: '₹ 200.00' },
        { label: 'Income Tax (TDS)', type: 'Deduction', amount: '₹ 2,200.00' }
      ],
      {
        title: `Salary Payslip — ${item.period}`,
        subtitle: `Disbursed Net Pay: ₹ ${item.netPay.toLocaleString('en-IN')}`,
        filename: `payslip_${item.period.replace(/\s+/g, '_')}`
      }
    );
  }
}
