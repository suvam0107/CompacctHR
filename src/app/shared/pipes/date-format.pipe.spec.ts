// src/app/shared/pipes/date-format.pipe.spec.ts
import { describe, it, expect } from 'vitest';
import { DateFormatPipe } from './date-format.pipe';

describe('DateFormatPipe', () => {
  const pipe = new DateFormatPipe();
  const testDate = new Date('2026-08-20T10:30:00Z');

  it('should format date string with short format', () => {
    const formatted = pipe.transform(testDate, 'short');
    expect(formatted).toBeTruthy();
    expect(formatted).toContain('2026');
  });

  it('should format date string with medium format', () => {
    const formatted = pipe.transform(testDate, 'medium');
    expect(formatted).toBeTruthy();
    expect(formatted).toContain('2026');
  });

  it('should return empty string for null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
