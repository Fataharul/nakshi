import { describe, it, expect } from 'vitest';
import {
  calculateMinimumBid,
  validateBidStepIncrement,
  placeBidSchema,
  createAuctionSchema,
  roundToTwoDecimals,
} from '../../src/utils/auction.validation';

describe('Auction Validation & Bidding Step Increment Logic', () => {
  describe('roundToTwoDecimals', () => {
    it('rounds floating point numbers accurately to 2 decimal places', () => {
      expect(roundToTwoDecimals(10.555)).toBe(10.56);
      expect(roundToTwoDecimals(10.1 + 0.2)).toBe(10.3);
      expect(roundToTwoDecimals(100)).toBe(100);
    });
  });

  describe('calculateMinimumBid', () => {
    it('returns starting bid when no previous bids exist (null)', () => {
      expect(calculateMinimumBid(null, 100, 10)).toBe(100);
    });

    it('returns starting bid when currentHighestBid is 0 or undefined', () => {
      expect(calculateMinimumBid(0, 50, 5)).toBe(50);
      expect(calculateMinimumBid(undefined, 75, 10)).toBe(75);
    });

    it('returns currentHighestBid + minIncrement when previous bid exists', () => {
      expect(calculateMinimumBid(100, 50, 10)).toBe(110);
      expect(calculateMinimumBid(250.5, 100, 25.25)).toBe(275.75);
    });

    it('supports Prisma Decimal-like objects with .toNumber() method', () => {
      const mockDecimalCurrent = { toNumber: () => 150 };
      const mockDecimalStart = { toNumber: () => 100 };
      const mockDecimalInc = { toNumber: () => 15 };

      expect(calculateMinimumBid(mockDecimalCurrent, mockDecimalStart, mockDecimalInc)).toBe(165);
    });
  });

  describe('validateBidStepIncrement', () => {
    it('approves an opening bid equal to starting bid', () => {
      const result = validateBidStepIncrement(100, null, 100, 10);
      expect(result.isValid).toBe(true);
      expect(result.minRequiredBid).toBe(100);
      expect(result.error).toBeUndefined();
    });

    it('approves an opening bid higher than starting bid', () => {
      const result = validateBidStepIncrement(120, null, 100, 10);
      expect(result.isValid).toBe(true);
      expect(result.minRequiredBid).toBe(100);
    });

    it('rejects an opening bid below the starting bid', () => {
      const result = validateBidStepIncrement(90, null, 100, 10);
      expect(result.isValid).toBe(false);
      expect(result.minRequiredBid).toBe(100);
      expect(result.error).toContain('below the opening starting bid of 100.00 credits');
    });

    it('approves a subsequent bid meeting the exact minimum increment', () => {
      const result = validateBidStepIncrement(110, 100, 50, 10);
      expect(result.isValid).toBe(true);
      expect(result.minRequiredBid).toBe(110);
    });

    it('approves a subsequent bid exceeding the minimum increment', () => {
      const result = validateBidStepIncrement(150, 100, 50, 10);
      expect(result.isValid).toBe(true);
      expect(result.minRequiredBid).toBe(110);
    });

    it('rejects a subsequent bid below currentHighestBid + minIncrement', () => {
      const result = validateBidStepIncrement(105, 100, 50, 10);
      expect(result.isValid).toBe(false);
      expect(result.minRequiredBid).toBe(110);
      expect(result.error).toContain('does not meet the minimum increment');
      expect(result.error).toContain('Must be at least 110.00 credits');
    });

    it('handles decimal increments accurately without floating point drift', () => {
      // 100.10 + 0.20 = 100.30
      const result = validateBidStepIncrement(100.29, 100.1, 50, 0.2);
      expect(result.isValid).toBe(false);
      expect(result.minRequiredBid).toBe(100.3);

      const validResult = validateBidStepIncrement(100.3, 100.1, 50, 0.2);
      expect(validResult.isValid).toBe(true);
    });

    it('rejects non-positive and zero bid amounts', () => {
      expect(validateBidStepIncrement(0, 100, 50, 10).isValid).toBe(false);
      expect(validateBidStepIncrement(-10, 100, 50, 10).isValid).toBe(false);
    });
  });

  describe('placeBidSchema (Zod Validation)', () => {
    it('accepts valid bid amounts with up to 2 decimal places', () => {
      expect(placeBidSchema.safeParse({ amount: 150 }).success).toBe(true);
      expect(placeBidSchema.safeParse({ amount: '150.50' }).success).toBe(true);
      expect(placeBidSchema.safeParse({ amount: 150.25 }).success).toBe(true);
    });

    it('rejects bid amounts with more than 2 decimal places', () => {
      const result = placeBidSchema.safeParse({ amount: 150.123 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('more than 2 decimal places');
      }
    });

    it('rejects zero or negative bid amounts', () => {
      expect(placeBidSchema.safeParse({ amount: 0 }).success).toBe(false);
      expect(placeBidSchema.safeParse({ amount: -50 }).success).toBe(false);
    });

    it('rejects non-numeric bid inputs', () => {
      expect(placeBidSchema.safeParse({ amount: 'invalid-bid' }).success).toBe(false);
    });
  });

  describe('createAuctionSchema (Zod Validation)', () => {
    const validPayload = {
      artworkId: '123e4567-e89b-12d3-a456-426614174000',
      startingBid: 100,
      minIncrement: 10,
      startTime: new Date('2026-10-01T10:00:00Z'),
      endTime: new Date('2026-10-01T12:00:00Z'),
    };

    it('accepts valid auction creation input', () => {
      const result = createAuctionSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects auction when endTime is before or equal to startTime', () => {
      const invalidPayload = {
        ...validPayload,
        endTime: new Date('2026-10-01T09:00:00Z'),
      };
      const result = createAuctionSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('End time must be after start time');
      }
    });

    it('rejects non-positive starting bid or min increment', () => {
      expect(createAuctionSchema.safeParse({ ...validPayload, startingBid: -10 }).success).toBe(false);
      expect(createAuctionSchema.safeParse({ ...validPayload, minIncrement: 0 }).success).toBe(false);
    });
  });
});
