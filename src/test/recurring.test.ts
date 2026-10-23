import { describe, it, expect } from 'vitest';
import { computeNextDate } from '../services/recurringService';

describe('Recurring Transactions Engine', () => {
  it('correctly advances weekly dates by exactly 7 days', () => {
    expect(computeNextDate('2026-10-01', 'weekly')).toBe('2026-10-08');
    expect(computeNextDate('2026-10-25', 'weekly')).toBe('2026-11-01');
  });

  it('correctly advances monthly dates and handles month ends', () => {
    expect(computeNextDate('2026-01-15', 'monthly')).toBe('2026-02-15');
    // Jan 31st -> Feb 28th (non-leap year)
    expect(computeNextDate('2026-01-31', 'monthly')).toBe('2026-02-28');
  });

  it('correctly advances yearly dates by 1 year', () => {
    expect(computeNextDate('2026-10-23', 'yearly')).toBe('2027-10-23');
  });
});
