// src/app/shared/components/date-range-picker/date-range-picker.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { PopoverModule, Popover } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { DateRangePreset, getDateRangePreset } from '../../utils/date-range.util';

export interface DateRangeValue {
  startDate: Date | null;
  endDate: Date | null;
}

interface PresetOption {
  label: string;
  value: DateRangePreset;
}

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule, PopoverModule, ButtonModule],
  templateUrl: './date-range-picker.html',
  styleUrls: ['./date-range-picker.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateRangePicker),
      multi: true
    }
  ]
})
export class DateRangePicker implements OnInit, ControlValueAccessor {
  @Input() label?: string; // Optional top label like 'Date Range'
  @Input() placeholder: string = 'Select Date Range';
  @Input() showPresets: boolean = true;
  @Input() defaultPreset: DateRangePreset = 'this_week';

  @Output() rangeChange = new EventEmitter<DateRangeValue>();

  @ViewChild('popover') popover?: Popover;

  startDate: Date | null = null;
  endDate: Date | null = null;
  calendarDates: Date[] | null = null;
  selectedPreset = signal<string>('this_week');

  presets: PresetOption[] = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This Week', value: 'this_week' },
    { label: 'This Month', value: 'this_month' },
    { label: 'This Year', value: 'this_year' },
    { label: 'Last Month', value: 'last_month' },
    { label: 'Last Quarter', value: 'last_quarter' }
  ];

  private onChange: (value: DateRangeValue) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    if (this.showPresets && !this.startDate && !this.endDate) {
      this.applyPreset(this.defaultPreset);
    }
  }

  get formattedRangeText(): string {
    if (this.startDate && this.endDate) {
      return `${this.formatDisplayDate(this.startDate)} – ${this.formatDisplayDate(this.endDate)}`;
    }
    if (this.startDate) {
      return `${this.formatDisplayDate(this.startDate)} – ...`;
    }
    return this.placeholder;
  }

  get hasSelection(): boolean {
    return !!this.startDate || !!this.endDate;
  }

  private formatDisplayDate(d: Date): string {
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  togglePopover(event: Event): void {
    this.popover?.toggle(event);
  }

  applyPreset(preset: DateRangePreset): void {
    const range = getDateRangePreset(preset);
    this.startDate = range.startDate;
    this.endDate = range.endDate;
    this.calendarDates = [new Date(range.startDate), new Date(range.endDate)];
    this.selectedPreset.set(preset);
    this.notifyChange();
  }

  onCalendarSelect(): void {
    if (this.calendarDates && this.calendarDates.length > 0) {
      this.startDate = this.calendarDates[0] ? new Date(this.calendarDates[0]) : null;
      if (this.calendarDates.length > 1 && this.calendarDates[1]) {
        this.endDate = new Date(this.calendarDates[1]);
        this.selectedPreset.set('custom');
        this.notifyChange();
      } else {
        this.endDate = null;
      }
    }
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.startDate = null;
    this.endDate = null;
    this.calendarDates = null;
    this.selectedPreset.set('custom');
    this.notifyChange();
  }

  private notifyChange(): void {
    const val: DateRangeValue = {
      startDate: this.startDate,
      endDate: this.endDate
    };
    this.onChange(val);
    this.rangeChange.emit(val);
    this.onTouched();
  }

  writeValue(value: DateRangeValue | null): void {
    if (value && value.startDate && value.endDate) {
      this.startDate = new Date(value.startDate);
      this.endDate = new Date(value.endDate);
      this.calendarDates = [new Date(value.startDate), new Date(value.endDate)];
    } else {
      this.startDate = null;
      this.endDate = null;
      this.calendarDates = null;
    }
  }

  registerOnChange(fn: (value: DateRangeValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
