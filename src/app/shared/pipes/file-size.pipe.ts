// src/app/shared/pipes/file-size.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileSize',
  standalone: true
})
export class FileSizePipe implements PipeTransform {
  transform(bytes: number | string | null | undefined, precision: number = 2): string {
    if (bytes === null || bytes === undefined || bytes === '') {
      return '';
    }

    const numBytes = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
    if (isNaN(numBytes) || numBytes < 0) {
      return '0 B';
    }

    if (numBytes === 0) {
      return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    const unitIndex = Math.min(i, units.length - 1);
    const size = numBytes / Math.pow(k, unitIndex);

    return `${size.toFixed(unitIndex === 0 ? 0 : precision)} ${units[unitIndex]}`;
  }
}
