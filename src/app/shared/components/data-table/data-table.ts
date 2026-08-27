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

  private searchableMap = new Map<T, string>();

  // Formatted & Multi-word Filtered Table Rows
  filteredValue = computed(() => {
    const rawData = this._value();
    if (!rawData || rawData.length === 0) return [];
    if (this.lazy) return rawData;

    const searchTerm = this.globalFilter().toLowerCase().trim();
    const colFilters = this.activeFilters();
    const hasGlobalSearch = searchTerm.length > 0;
    const hasColFilters = Object.keys(colFilters).length > 0;

    if (!hasGlobalSearch && !hasColFilters) {
      return rawData;
    }

    const tokens = hasGlobalSearch ? searchTerm.split(/\s+/).filter(Boolean) : [];

    return rawData.filter(row => {
      // 1. Column Filter Match
      if (hasColFilters) {
        for (const [field, filterVal] of Object.entries(colFilters)) {
          if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
            const rowVal = this.resolveFieldValue(row, field);
            if (String(rowVal) !== String(filterVal)) {
              return false;
            }
          }
        }
      }

      // 2. Global Multi-Word & Formatted Date Search Match
      if (hasGlobalSearch) {
        let searchableText = this.searchableMap.get(row);
        if (searchableText === undefined) {
          searchableText = this.buildRowSearchableText(row);
          this.searchableMap.set(row, searchableText);
        }
        for (const token of tokens) {
          if (!searchableText.includes(token)) {
            return false;
          }
        }
      }

      return true;
    });
  });

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
    this.buildSearchableMap();
  }

  private buildSearchableMap(): void {
    this.searchableMap.clear();
    const rows = this._value();
    if (!rows || rows.length === 0) return;

    for (const row of rows) {
      this.searchableMap.set(row, this.buildRowSearchableText(row));
    }
  }

  private resolveFieldValue(row: Record<string, unknown>, field: string): unknown {
    if (!field) return undefined;
    if (!field.includes('.')) return row[field];
    const parts = field.split('.');
    let curr: unknown = row;
    for (const p of parts) {
      if (curr && typeof curr === 'object') {
        curr = (curr as Record<string, unknown>)[p];
      } else {
        return undefined;
      }
    }
    return curr;
  }

  private formatDateVariants(val: unknown): string[] {
    if (!val) return [];
    let d: Date | null = null;

    if (val instanceof Date) {
      d = val;
    } else if (typeof val === 'number') {
      d = new Date(val);
    } else if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed) return [];
      if (trimmed.includes('-') || trimmed.includes('/') || trimmed.includes('T') || trimmed.includes(',')) {
        const parsed = Date.parse(trimmed);
        if (!isNaN(parsed)) {
          d = new Date(parsed);
        }
      }
    }

    if (!d || isNaN(d.getTime())) return [];

    const monthsShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthsFull = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

    const day = d.getDate();
    const dayPadded = String(day).padStart(2, '0');
    const monthIdx = d.getMonth();
    const monthShort = monthsShort[monthIdx];
    const monthFull = monthsFull[monthIdx];
    const monthNum = monthIdx + 1;
    const monthNumPadded = String(monthNum).padStart(2, '0');
    const year = d.getFullYear();

    return [
      `${day} ${monthShort} ${year}`,
      `${dayPadded} ${monthShort} ${year}`,
      `${day} ${monthFull} ${year}`,
      `${dayPadded} ${monthFull} ${year}`,
      `${monthShort} ${day}`,
      `${monthShort} ${dayPadded}`,
      `${monthFull} ${day}`,
      `${dayPadded}-${monthNumPadded}-${year}`,
      `${dayPadded}/${monthNumPadded}/${year}`,
      `${day}-${monthNum}-${year}`,
      `${day}/${monthNum}/${year}`,
      `${year}-${monthNumPadded}-${dayPadded}`,
      `${dayPadded}-${monthShort}-${year}`,
      `${dayPadded}/${monthShort}/${year}`
    ];
  }

  private buildRowSearchableText(row: T): string {
    const parts: string[] = [];

    // 1. Inspect defined columns
    for (const col of this.columns) {
      const val = this.resolveFieldValue(row, col.field);
      if (val === undefined || val === null) continue;

      const strVal = String(val);
      parts.push(strVal);

      if (col.type === 'date' || (typeof val === 'string' && (val.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(val)))) {
        parts.push(...this.formatDateVariants(val));
      }

      if (col.type === 'currency' && typeof val === 'number') {
        parts.push(`₹${val.toLocaleString('en-IN')}`);
        parts.push(val.toLocaleString('en-IN'));
      }
    }

    // 2. Also collect all root and nested primitive values
    this.collectAllPrimitiveStrings(row, parts);

    return parts.join(' ').toLowerCase();
  }

  private collectAllPrimitiveStrings(obj: unknown, parts: string[], depth = 0): void {
    if (!obj || depth > 2) return;
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
      parts.push(String(obj));
      return;
    }
    if (typeof obj === 'object') {
      for (const key of Object.keys(obj as Record<string, unknown>)) {
        const val = (obj as Record<string, unknown>)[key];
        if (typeof val === 'string' || typeof val === 'number') {
          parts.push(String(val));
          if (typeof val === 'string' && (val.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(val))) {
            parts.push(...this.formatDateVariants(val));
          }
        } else if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
          this.collectAllPrimitiveStrings(val, parts, depth + 1);
        }
      }
    }
  }

  onSearch(term: string): void {
    this.globalFilter.set(term);
    this.search.emit(term);
  }

  onDateRangeSelected(range: DateRangeValue): void {
    this.dateRangeChange.emit(range);
  }

  getExportData(): T[] {
    return this.filteredValue();
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

    const valuesSet = new Set<unknown>();
    const currentData = this.filteredValue();
    if (currentData && currentData.length > 0) {
      for (const row of currentData) {
        const val = this.resolveFieldValue(row, col.field);
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
    } else {
      updated[field] = value;
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
    this.clearFilters.emit();
  }
}

