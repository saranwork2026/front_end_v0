import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatWalletBalance, truncateText } from '../formatters';

describe('formatCurrency', () => {
  it('should format a small amount without grouping', () => {
    expect(formatCurrency(500)).toBe('₹500.00');
  });

  it('should format thousands with a single grouping separator', () => {
    expect(formatCurrency(12345)).toBe('₹12,345.00');
  });

  it('should use the Indian numbering system for large amounts', () => {
    // 123456.7 -> last 3 digits, then groups of 2
    expect(formatCurrency(123456.7)).toBe('₹1,23,456.70');
  });

  it('should group crore-scale amounts correctly', () => {
    expect(formatCurrency(10000000)).toBe('₹1,00,00,000.00');
  });

  it('should prefix a minus sign for negative amounts', () => {
    expect(formatCurrency(-1234.5)).toBe('-₹1,234.50');
  });

  it('should always render exactly two decimal places', () => {
    expect(formatCurrency(100)).toBe('₹100.00');
  });
});

describe('formatDate', () => {
  it('should convert an ISO date string to DD/MM/YYYY', () => {
    expect(formatDate('2024-03-15T10:30:00Z')).toBe('15/03/2024');
  });

  it('should zero-pad single-digit day and month', () => {
    expect(formatDate('2024-01-05T00:00:00Z')).toBe('05/01/2024');
  });
});

describe('formatWalletBalance', () => {
  it('should pad a whole number to two decimals', () => {
    expect(formatWalletBalance(100)).toBe('100.00');
  });

  it('should keep two decimals for a fractional amount', () => {
    expect(formatWalletBalance(1234.5)).toBe('1234.50');
  });
});

describe('truncateText', () => {
  it('should return the original text when shorter than the limit', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('should return the original text when exactly at the limit', () => {
    expect(truncateText('hello', 5)).toBe('hello');
  });

  it('should truncate and append an ellipsis when longer than the limit', () => {
    expect(truncateText('hello world', 5)).toBe('hello...');
  });
});
