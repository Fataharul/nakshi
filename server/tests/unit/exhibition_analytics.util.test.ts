import { describe, it, expect } from 'vitest';
import {
  calculateAverageViewingTime,
  calculateTicketRevenue,
} from '../../src/utils/exhibition-analytics.util';

describe('calculateAverageViewingTime', () => {
  it('returns 0 for no visits', () => {
    expect(calculateAverageViewingTime([])).toBe(0);
  });

  it('averages valid durations and ignores invalid ones', () => {
    expect(calculateAverageViewingTime([60, 120, 0, -5, NaN])).toBe(90);
  });

  it('rounds to whole seconds', () => {
    expect(calculateAverageViewingTime([10, 11])).toBe(11);
  });
});

describe('calculateTicketRevenue', () => {
  it('returns 0 when no tickets sold', () => {
    expect(calculateTicketRevenue([])).toBe(0);
  });

  it('sums numbers and decimal strings without float errors', () => {
    expect(calculateTicketRevenue(['25.00', 12.5, '0.10', '0.20'])).toBe(37.8);
  });

  it('sums whole amounts', () => {
    expect(calculateTicketRevenue([25, 25, 37.5])).toBe(87.5);
  });
});