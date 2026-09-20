import { describe, it, expect } from 'vitest';

import { describeQuota } from '../quota';

describe('describeQuota', () => {
  it('should report unlimited with a full bar when total is -1', () => {
    const result = describeQuota(0, -1);
    expect(result.unlimited).toBe(true);
    expect(result.percent).toBe(100);
  });

  it('should report unlimited when remaining is -1', () => {
    const result = describeQuota(-1, 100);
    expect(result.unlimited).toBe(true);
    expect(result.percent).toBe(100);
  });

  it('should compute a proportional percentage for a partially-used quota', () => {
    const result = describeQuota(50, 100);
    expect(result.unlimited).toBe(false);
    expect(result.percent).toBe(50);
  });

  it('should return 0 percent when nothing remains', () => {
    const result = describeQuota(0, 100);
    expect(result.unlimited).toBe(false);
    expect(result.percent).toBe(0);
  });

  it('should return 100 percent when the full quota remains', () => {
    const result = describeQuota(100, 100);
    expect(result.percent).toBe(100);
  });

  it('should clamp above 100 percent (remaining greater than total)', () => {
    const result = describeQuota(150, 100);
    expect(result.percent).toBe(100);
  });

  it('should treat a zero total as 0 percent (no divide-by-zero)', () => {
    const result = describeQuota(0, 0);
    expect(result.unlimited).toBe(false);
    expect(result.percent).toBe(0);
  });
});
