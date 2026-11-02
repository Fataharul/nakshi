import { describe, it, expect } from 'vitest';
import {
  computeVipStatus,
  formatVipDuration,
  configureVipScheduleSchema,
  createExhibitionSchema,
} from '../../src/utils/exhibition.validation';

describe('Exhibition Validation & VIP Utilities', () => {
  describe('computeVipStatus', () => {
    it('returns NOT_CONFIGURED when VIP dates are null or missing', () => {
      const now = new Date('2026-10-15T12:00:00Z');
      expect(computeVipStatus(now, null, null)).toBe('NOT_CONFIGURED');
      expect(computeVipStatus(now, '2026-10-16T00:00:00Z', null)).toBe('NOT_CONFIGURED');
      expect(computeVipStatus(now, null, '2026-10-16T00:00:00Z')).toBe('NOT_CONFIGURED');
    });

    it('returns NOT_CONFIGURED for invalid date strings', () => {
      const now = new Date('2026-10-15T12:00:00Z');
      expect(computeVipStatus(now, 'invalid-date', 'another-bad-date')).toBe('NOT_CONFIGURED');
    });

    it('returns SCHEDULED when current time is before vipStartTime', () => {
      const now = new Date('2026-10-10T10:00:00Z');
      const start = '2026-10-12T10:00:00Z';
      const end = '2026-10-14T10:00:00Z';
      expect(computeVipStatus(now, start, end)).toBe('SCHEDULED');
    });

    it('returns ACTIVE when current time is within VIP viewing window', () => {
      const now = new Date('2026-10-13T10:00:00Z');
      const start = '2026-10-12T10:00:00Z';
      const end = '2026-10-14T10:00:00Z';
      expect(computeVipStatus(now, start, end)).toBe('ACTIVE');
    });

    it('returns CONCLUDED when current time is after vipEndTime', () => {
      const now = new Date('2026-10-15T10:00:00Z');
      const start = '2026-10-12T10:00:00Z';
      const end = '2026-10-14T10:00:00Z';
      expect(computeVipStatus(now, start, end)).toBe('CONCLUDED');
    });
  });

  describe('formatVipDuration', () => {
    it('returns formatted hours for sub-24h window', () => {
      const start = '2026-10-12T10:00:00Z';
      const end = '2026-10-12T18:00:00Z';
      expect(formatVipDuration(start, end)).toBe('8 hours preview');
    });

    it('returns formatted days for multi-day window', () => {
      const start = '2026-10-12T10:00:00Z';
      const end = '2026-10-14T10:00:00Z';
      expect(formatVipDuration(start, end)).toBe('2 days preview (48h)');
    });

    it('returns null for missing or invalid dates', () => {
      expect(formatVipDuration(null, null)).toBeNull();
      expect(formatVipDuration('2026-10-14T10:00:00Z', '2026-10-12T10:00:00Z')).toBeNull();
    });
  });

  describe('configureVipScheduleSchema', () => {
    it('successfully parses valid VIP schedule when enabled', () => {
      const payload = {
        isVipEnabled: true,
        vipStartTime: '2026-10-12T10:00:00.000Z',
        vipEndTime: '2026-10-14T10:00:00.000Z',
      };
      const result = configureVipScheduleSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects when vipEndTime <= vipStartTime', () => {
      const payload = {
        isVipEnabled: true,
        vipStartTime: '2026-10-14T10:00:00.000Z',
        vipEndTime: '2026-10-12T10:00:00.000Z',
      };
      const result = configureVipScheduleSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('after VIP start time');
      }
    });

    it('rejects when enabled but dates are missing', () => {
      const payload = {
        isVipEnabled: true,
        vipStartTime: '',
        vipEndTime: '',
      };
      const result = configureVipScheduleSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('successfully parses disabled VIP schedule with null dates', () => {
      const payload = {
        isVipEnabled: false,
        vipStartTime: null,
        vipEndTime: null,
      };
      const result = configureVipScheduleSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  describe('createExhibitionSchema', () => {
    it('validates a correct exhibition schema', () => {
      const payload = {
        title: 'Heritage Muslin & Kantha Retrospective',
        description: 'An exclusive curation of Bangladeshi textile craft history.',
        ticketPrice: 25.0,
        startTime: '2026-11-01T10:00:00.000Z',
        endTime: '2026-11-15T18:00:00.000Z',
        isVipEnabled: true,
        vipStartTime: '2026-10-30T10:00:00.000Z',
        vipEndTime: '2026-11-01T09:59:59.000Z',
      };
      const result = createExhibitionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects when exhibition endTime is before startTime', () => {
      const payload = {
        title: 'Invalid Schedule Exhibition',
        description: 'An exhibition with invalid start/end schedule.',
        ticketPrice: 10,
        startTime: '2026-11-15T10:00:00.000Z',
        endTime: '2026-11-01T10:00:00.000Z',
      };
      const result = createExhibitionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
