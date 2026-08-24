// src/app/shared/components/date-range-picker/date-range-picker.ts
import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { DateRangePreset, getDateRangePreset } from '../../utils/date-range.util';
import { DropdownOption } from '../../models/dropdown-option.model';

export interface DateRangeValue {
  startDate: Date | null;
  endDate: Date | null;
}

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule, SelectModule],
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
  @Input() showPresets: boolean = true;
  @Input() placeholder: string = 'Select Date Range';
  @Input() dateFormat: string = 'dd M yy';

  @Output() rangeChange = new EventEmitter<DateRangeValue>();

  dates: Date[] | null = null;
  selectedPreset: string = 'this_month';

  presets: DropdownOption<string>[] = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This Week', value: 'this_week' },
    { label: 'Last Week', value: 'last_week' },
    { label: 'This Month', value: 'this_month' },
    { label: 'Last Month', value: 'last_month' },
    { label: 'This Quarter', value: 'this_quarter' },
    { label: 'This Year', value: 'this_year' },
    { label: 'Custom Range', value: 'custom' }
  ];

  private onChange: (value: DateRangeValue) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    if (this.showPresets && !this.dates) {
      this.applyPreset('this_month');
    }
  }

  onPresetChange(preset: string): void {
    if (preset === 'custom') {
      return;
    }
    this.applyPreset(preset as DateRangePreset);
  }

  applyPreset(preset: DateRangePreset): void {
    const range = getDateRangePreset(preset);
    this.dates = [range.startDate, range.endDate];
    this.selectedPreset = preset;
    this.notifyChange();
  }

  onDateSelect(): void {
    this.selectedPreset = 'custom';
    if (this.dates && this.dates[0]) {
      this.notifyChange();
    }
  }

  private notifyChange(): void {
    const val: DateRangeValue = {
      startDate: this.dates && this.dates[0] ? this.dates[0] : null,
      endDate: this.dates && this.dates[1] ? this.dates[1] : (this.dates && this.dates[0] ? this.dates[0] : null)
    };
    this.onChange(val);
    this.rangeChange.emit(val);
    this.onTouched();
  }

  writeValue(value: DateRangeValue | null): void {
    if (value && value.startDate && value.endDate) {
      this.dates = [new Date(value.startDate), new Date(value.endDate)];
    } else {
      this.dates = null;
    }
  }

  registerOnChange(fn: (value: DateRangeValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
