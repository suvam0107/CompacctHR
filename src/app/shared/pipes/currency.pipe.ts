// src/app/shared/pipes/currency.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appCurrency',
  standalone: true
})
export class CurrencyPipe implements PipeTransform {
  transform(
    value: number | string | null | undefined,
    currencyCode: string = 'INR',
    display: 'symbol' | 'code' | 'compact' = 'symbol',
    digitsInfo: string = '1.0-2'
  ): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
      return String(value);
    }

    if (display === 'compact') {
      const abs = Math.abs(num);
      const sign = num < 0 ? '-' : '';
      const sym = currencyCode === 'INR' ? '₹' : '$';

      if (currencyCode === 'INR') {
        if (abs >= 10000000) {
          return `${sign}${sym}${(abs / 10000000).toFixed(2)} Cr`;
        }
        if (abs >= 100000) {
          return `${sign}${sym}${(abs / 100000).toFixed(2)} L`;
        }
        if (abs >= 1000) {
          return `${sign}${sym}${(abs / 1000).toFixed(1)} k`;
        }
        return `${sign}${sym}${abs.toFixed(0)}`;
      } else {
        if (abs >= 1000000) {
          return `${sign}${sym}${(abs / 1000000).toFixed(2)}M`;
        }
        if (abs >= 1000) {
          return `${sign}${sym}${(abs / 1000).toFixed(1)}k`;
        }
        return `${sign}${sym}${abs.toFixed(0)}`;
      }
    }

    const [minInteger, fractionDigits] = digitsInfo.split('.');
    const [minFraction, maxFraction] = (fractionDigits || '0-2').split('-');

    return new Intl.NumberFormat(currencyCode === 'INR' ? 'en-IN' : 'en-US', {
      style: display === 'code' ? 'currency' : 'currency',
      currency: currencyCode,
      currencyDisplay: display === 'code' ? 'code' : 'symbol',
      minimumIntegerDigits: parseInt(minInteger, 10) || 1,
      minimumFractionDigits: parseInt(minFraction, 10) || 0,
      maximumFractionDigits: parseInt(maxFraction, 10) || 2
    }).format(num);
  }
}
