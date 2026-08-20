// src/app/shared/pipes/date-format.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date | number | null | undefined, format: 'short' | 'medium' | 'long' | 'time' | 'full' = 'medium'): string {
    if (!value) return '';

    const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
    if (isNaN(date.getTime())) {
      return String(value);
    }

    switch (format) {
      case 'short':
        return new Intl.DateTimeFormat('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).format(date);

      case 'medium':
        return new Intl.DateTimeFormat('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }).format(date);

      case 'long':
        return new Intl.DateTimeFormat('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }).format(date);

      case 'time':
        return new Intl.DateTimeFormat('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).format(date);

      case 'full':
        return new Intl.DateTimeFormat('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).format(date);

      default:
        return new Intl.DateTimeFormat('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }).format(date);
    }
  }
}
