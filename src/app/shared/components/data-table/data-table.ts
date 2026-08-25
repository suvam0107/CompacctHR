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
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { PopoverModule, Popover } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import { SearchInput } from '../search-input/search-input';
import { ExportButton, ExportColumn } from '../export-button/export-button';
import { LoadingSkeleton } from '../loading-skeleton/loading-skeleton';
import { EmptyState } from '../empty-state/empty-state';
import { StatusBadge } from '../status-badge/status-badge';
import { DateRangePicker, DateRangeValue } from '../date-range-picker/date-range-picker';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { CurrencyPipe } from '../../pipes/currency.pipe';
import { DropdownOption } from '../../models/dropdown-option.model';

export interface DataTableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: DropdownOption<string | number>[];
  link?: boolean;
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
    PopoverModule,
    TooltipModule,
    SearchInput,
    ExportButton,
    LoadingSkeleton,
    EmptyState,
    StatusBadge,
    DateRangePicker,
    DateFormatPipe,
    CurrencyPipe
  ],
  templateUrl: './data-table.html',
  styleUrls: ['./data-table.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTable<T extends Record<string, unknown> = Record<string, unknown>> implements OnInit, OnChanges {
  @Input({ required: true }) columns: DataTableColumn[] = [];

  private _value = signal<T[]>([]);
  private _loading = signal<boolean>(false);

  @Input() set value(val: T[] | null | undefined) {
    this._value.set(val || []);
    this.refreshComputedProps();
  }
  get value(): T[] {
    return this._value();
  }

  @Input() set loading(val: boolean | null | undefined) {
    this._loading.set(!!val);
  }
  get loading(): boolean {
    return this._loading();
  }

  @Input() totalRecords: number = 0;
  @Input() lazy: boolean = false;
  @Input() paginator: boolean = true;
  @Input() rows: number = 10;
  @Input() rowsPerPageOptions: number[] = [10, 25, 50, 100];
  @Input() dataKey: string = 'id';
  @Input() size: 'small' | 'large' = 'small';
  @Input() responsiveLayout: 'scroll' | 'stack' = 'scroll';
  @Input() stripedRows: boolean = true;

  // Header options
  @Input() title?: string; // Used strictly for exported report title
  @Input() subtitle?: string;
  @Input() showSearch: boolean = true;
  @Input() searchPlaceholder: string = 'Search table...';
  @Input() showExport: boolean = true;
  @Input() exportFilename: string = 'table_export';
  @Input() showDateRange: boolean = false;

  // Empty state options
  @Input() emptyTitle: string = 'No records found';
  @Input() emptyMessage: string = 'Try adjusting your search or filters.';
  @Input() emptyIcon: string = 'pi pi-folder-open';

  @Output() lazyLoad = new EventEmitter<TableLazyLoadEvent>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() cellLinkClick = new EventEmitter<{ row: T; column: DataTableColumn }>();
  @Output() search = new EventEmitter<string>();
  @Output() dateRangeChange = new EventEmitter<DateRangeValue>();
  @Output() clearFilters = new EventEmitter<void>();

  // Custom slots
  @ContentChild('customCell') customCellTemplate?: TemplateRef<unknown>;
  @ContentChild('actions') actionsTemplate?: TemplateRef<unknown>;
  @ContentChild('toolbar') toolbarTemplate?: TemplateRef<unknown>;
  @ContentChild('headerActions') headerActionsTemplate?: TemplateRef<unknown>;
  @ContentChild('dateRange') dateRangeTemplate?: TemplateRef<unknown>;

  @ViewChild('dt') dtTable?: Table;
  @ViewChild('searchInput') searchInputComponent?: SearchInput;

  globalFilter = signal<string>('');
  activeFilters = signal<Record<string, unknown>>({});
  activeFilterColumn = signal<DataTableColumn | null>(null);
  filterSearchTerm = signal<string>('');

  filterFieldNames: string[] = [];
  exportColumns: ExportColumn[] = [];

  hasRecords = computed(() => this._value().length > 0 || this._loading());
  isFiltered = computed(() => Object.keys(this.activeFilters()).length > 0 || !!this.globalFilter());

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

  onDateRangeSelected(range: DateRangeValue): void {
    this.dateRangeChange.emit(range);
  }

  getExportData(): T[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filtered = (this.dtTable as any)?.filteredValue;
    return (filtered && Array.isArray(filtered) && filtered.length > 0) ? filtered : this.value;
  }

  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }

  onLinkClick(event: MouseEvent, row: T, col: DataTableColumn): void {
    event.stopPropagation();
    this.cellLinkClick.emit({ row, column: col });
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.lazyLoad.emit(event);
  }

  // Column Filtering
  openColumnFilter(event: Event, col: DataTableColumn, popover: Popover): void {
    event.stopPropagation();
    this.activeFilterColumn.set(col);
    this.filterSearchTerm.set('');
    popover.toggle(event);
  }

  isColumnFiltered(field: string): boolean {
    const val = this.activeFilters()[field];
    return val !== undefined && val !== null && val !== '';
  }

  getColumnFilterOptions(col: DataTableColumn | null): { label: string; value: unknown }[] {
    if (!col) return [];

    if (col.filterOptions && col.filterOptions.length > 0) {
      const search = this.filterSearchTerm().toLowerCase().trim();
      if (!search) return col.filterOptions;
      return col.filterOptions.filter(o => o.label.toLowerCase().includes(search));
    }

    // Extract unique values from data
    const valuesSet = new Set<unknown>();
    const currentData = this._value();
    if (currentData && currentData.length > 0) {
      for (const row of currentData) {
        const val = row[col.field];
        if (val !== undefined && val !== null && val !== '') {
          valuesSet.add(val);
        }
      }
    }

    const options = Array.from(valuesSet).map(val => ({
      label: String(val),
      value: val
    }));

    const search = this.filterSearchTerm().toLowerCase().trim();
    if (!search) return options;
    return options.filter(o => o.label.toLowerCase().includes(search));
  }

  applyColumnFilter(field: string, value: unknown, popover?: Popover): void {
    const updated = { ...this.activeFilters() };
    if (value === null || value === undefined || value === '') {
      delete updated[field];
      if (this.dtTable) {
        this.dtTable.filter(null, field, 'equals');
      }
    } else {
      updated[field] = value;
      if (this.dtTable) {
        this.dtTable.filter(value, field, 'equals');
      }
    }
    this.activeFilters.set(updated);
    if (popover) {
      popover.hide();
    }
  }

  clearColumnFilter(field: string, popover?: Popover): void {
    this.applyColumnFilter(field, null, popover);
  }

  clearAllFilters(): void {
    this.globalFilter.set('');
    this.activeFilters.set({});
    if (this.searchInputComponent) {
      this.searchInputComponent.clear();
    }
    if (this.dtTable) {
      this.dtTable.clear();
      this.dtTable.filterGlobal('', 'contains');
    }
    this.clearFilters.emit();
  }
}
