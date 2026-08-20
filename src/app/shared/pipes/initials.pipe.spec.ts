// src/app/shared/pipes/initials.pipe.spec.ts
import { describe, it, expect } from 'vitest';
import { InitialsPipe } from './initials.pipe';

describe('InitialsPipe', () => {
  const pipe = new InitialsPipe();

  it('should extract first and last initials from a two-word name', () => {
    expect(pipe.transform('Aayush Sharma')).toBe('AS');
  });

  it('should extract first and last initials from a multi-word name', () => {
    expect(pipe.transform('John Michael Doe')).toBe('JD');
  });

  it('should handle a single word name', () => {
    expect(pipe.transform('Admin')).toBe('AD');
  });

  it('should return empty string for null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });
});
