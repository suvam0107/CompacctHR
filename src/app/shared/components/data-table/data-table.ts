// src/app/shared/components/data-table/data-table.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ContentChild,
  ViewChild,
  TemplateRef,
  ChangeDetectionStrategy,
  OnChanges,
  OnInit,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SearchInput } from '../search-input/search-input';
import { ExportButton, ExportColumn } from '../export-button/export-button';
import { LoadingSkeleton } from '../loading-skeleton/loading-skeleton';
import { EmptyState } from '../empty-state/empty-state';
import { StatusBadge } from '../status-badge/status-badge';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { CurrencyPipe } from '../../pipes/currency.pipe';

export interface DataTableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  width?: string;
  type?: 'text' | 'date' | 'currency' | 'status' | 'custom';
  align?: 'left' | 'center' | 'right';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    SearchInput,
    ExportButton,
    LoadingSkeleton,
    EmptyState,
    StatusBadge,
    DateFormatPipe,
    CurrencyPipe
  ],
  templateUrl: './data-table.html',
  styleUrls: ['./data-table.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTable<T extends Record<string, unknown> = Record<string, unknown>> implements OnInit, OnChanges {
  @Input({ required: true }) columns: DataTableColumn[] = [];
  @Input() value: T[] = [];
  @Input() totalRecords: number = 0;
  @Input() loading: boolean = false;
  @Input() lazy: boolean = false;
  @Input() paginator: boolean = true;
  @Input() rows: number = 10;
  @Input() rowsPerPageOptions: number[] = [10, 25, 50, 100];
  @Input() dataKey: string = 'id';
  @Input() size: 'small' | 'large' = 'small';
  @Input() responsiveLayout: 'scroll' | 'stack' = 'scroll';
  @Input() stripedRows: boolean = true;

  // Header options
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() showSearch: boolean = true;
  @Input() searchPlaceholder: string = 'Search table...';
  @Input() showExport: boolean = true;
  @Input() exportFilename: string = 'table_export';

  // Empty state options
  @Input() emptyTitle: string = 'No records found';
  @Input() emptyMessage: string = 'Try adjusting your search or filters.';
  @Input() emptyIcon: string = 'pi pi-folder-open';

  @Output() lazyLoad = new EventEmitter<TableLazyLoadEvent>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() search = new EventEmitter<string>();

  // Custom slots
  @ContentChild('customCell') customCellTemplate?: TemplateRef<unknown>;
  @ContentChild('actions') actionsTemplate?: TemplateRef<unknown>;
  @ContentChild('toolbar') toolbarTemplate?: TemplateRef<unknown>;

  @ViewChild('dt') dtTable?: Table;

  globalFilter = signal<string>('');
  filterFieldNames: string[] = [];
  exportColumns: ExportColumn[] = [];

  ngOnInit(): void {
    this.refreshComputedProps();
  }

  ngOnChanges(): void {
    this.refreshComputedProps();
  }

  private refreshComputedProps(): void {
    this.filterFieldNames = (this.columns || []).map(c => c.field);
    this.exportColumns = (this.columns || []).map(c => ({
      header: c.header,
      field: c.field,
      width: c.width
    }));
  }

  onSearch(term: string): void {
    this.globalFilter.set(term);
    if (this.dtTable) {
      this.dtTable.filterGlobal(term, 'contains');
    }
    this.search.emit(term);
  }

  getExportData(): T[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filtered = (this.dtTable as any)?.filteredValue;
    return (filtered && Array.isArray(filtered) && filtered.length > 0) ? filtered : this.value;
  }

  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.lazyLoad.emit(event);
  }
}
