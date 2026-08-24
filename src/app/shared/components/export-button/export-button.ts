// src/app/shared/components/export-button/export-button.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { exportToExcel, ExcelColumn } from '../../utils/excel-export.util';
import { exportToPdf, PdfTableColumn } from '../../utils/pdf-export.util';

export interface ExportColumn {
  header: string;
  field: string;
  width?: string | number;
}

@Component({
  selector: 'app-export-button',
  standalone: true,
  imports: [CommonModule, ButtonModule, MenuModule],
  templateUrl: './export-button.html',
  styleUrls: ['./export-button.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExportButton {
  @Input() label: string = 'Export';
  @Input() icon: string = 'pi pi-download';
  @Input() filename: string = 'export';
  @Input() title?: string;

  // Auto-export support if columns & data are passed
  @Input() columns?: ExportColumn[];
  @Input() data?: Record<string, unknown>[];

  @Output() exportExcel = new EventEmitter<void>();
  @Output() exportPdf = new EventEmitter<void>();

  menuItems: MenuItem[] = [
    {
      label: 'Export to Excel (.xlsx)',
      icon: 'pi pi-file-excel',
      command: () => this.onExportExcel()
    },
    {
      label: 'Export to PDF (.pdf)',
      icon: 'pi pi-file-pdf',
      command: () => this.onExportPdf()
    }
  ];

  private async onExportExcel(): Promise<void> {
    if (this.columns && this.data) {
      const excelCols: ExcelColumn[] = this.columns.map(c => ({
        header: c.header,
        key: c.field,
        width: typeof c.width === 'number' ? c.width : undefined
      }));
      await exportToExcel(excelCols, this.data, {
        filename: this.filename,
        title: this.title
      });
    }
    this.exportExcel.emit();
  }

  private async onExportPdf(): Promise<void> {
    if (this.columns && this.data) {
      const pdfCols: PdfTableColumn[] = this.columns.map(c => ({
        header: c.header,
        key: c.field
      }));
      await exportToPdf(pdfCols, this.data, {
        filename: this.filename,
        title: this.title || this.filename
      });
    }
    this.exportPdf.emit();
  }
}
