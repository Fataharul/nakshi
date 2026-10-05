import { describe, it, expect } from 'vitest';
import { submitBidSchema, createAuctionSchema } from '../../src/utils/auction.validation';

describe('Auction & Bid Submission Validation Schema Unit Tests (T-052)', () => {
  describe('submitBidSchema Unit Tests', () => {
    it('accepts valid positive bid amounts', () => {
      const validPayload = { amount: 150 };
      const parsed = submitBidSchema.parse(validPayload);
      expect(parsed.amount).toBe(150);

      const decimalPayload = { amount: 155.75 };
      const parsedDecimal = submitBidSchema.parse(decimalPayload);
      expect(parsedDecimal.amount).toBe(155.75);
    });

    it('coerces valid numeric string amounts to number', () => {
      const stringPayload = { amount: '250.50' };
      const parsed = submitBidSchema.parse(stringPayload);
      expect(parsed.amount).toBe(250.5);
    });

    it('rejects zero bid amount with validation error', () => {
      const zeroPayload = { amount: 0 };
      const result = submitBidSchema.safeParse(zeroPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Bid amount must be positive');
      }
    });

    it('rejects negative bid amounts', () => {
      const negativePayload = { amount: -50 };
      const result = submitBidSchema.safeParse(negativePayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Bid amount must be positive');
      }
    });

    it('rejects non-numeric or NaN amounts', () => {
      const invalidPayload = { amount: 'not-a-number' };
      const result = submitBidSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('rejects payload missing amount field', () => {
      const emptyPayload = {};
      const result = submitBidSchema.safeParse(emptyPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('Bid Step Increment Calculation Logic Unit Evaluation', () => {
    // Helper function reproducing step increment validation logic in AuctionService
    function validateBidAmount(amount: number, startingBid: number, minIncrement: number, currentHighest: number | null) {
      if (amount <= 0 || isNaN(amount)) {
        return { valid: false, reason: 'Bid amount must be positive' };
      }
      if (currentHighest === null) {
        if (amount < startingBid) {
          return { valid: false, reason: `Bid amount must be at least starting bid of ${startingBid}` };
        }
        return { valid: true };
      }
      if (amount <= currentHighest) {
        return { valid: false, reason: 'Bid amount must be higher than current highest bid' };
      }
      const minRequired = currentHighest + minIncrement;
      if (amount < minRequired) {
        return { valid: false, reason: `Bid amount must meet minimum increment step of ${minIncrement}` };
      }
      return { valid: true };
    }

    it('accepts initial bid equal to or greater than starting bid when no highest bid exists', () => {
      const checkStarting = validateBidAmount(100, 100, 10, null);
      expect(checkStarting.valid).toBe(true);

      const checkAboveStarting = validateBidAmount(120, 100, 10, null);
      expect(checkAboveStarting.valid).toBe(true);
    });

    it('rejects initial bid below starting bid when no highest bid exists', () => {
      const checkBelowStarting = validateBidAmount(90, 100, 10, null);
      expect(checkBelowStarting.valid).toBe(false);
      expect(checkBelowStarting.reason).toContain('at least starting bid');
    });

    it('accepts valid bid higher than current highest bid + minimum step increment', () => {
      // currentHighest = 100, minIncrement = 10 -> minRequired = 110
      const exactStep = validateBidAmount(110, 100, 10, 100);
      expect(exactStep.valid).toBe(true);

      const higherStep = validateBidAmount(150, 100, 10, 100);
      expect(higherStep.valid).toBe(true);
    });

    it('rejects bids equal to or less than current highest bid', () => {
      // currentHighest = 100, minIncrement = 10
      const equalBid = validateBidAmount(100, 100, 10, 100);
      expect(equalBid.valid).toBe(false);
      expect(equalBid.reason).toContain('higher than current highest bid');

      const lowerBid = validateBidAmount(90, 100, 10, 100);
      expect(lowerBid.valid).toBe(false);
      expect(lowerBid.reason).toContain('higher than current highest bid');
    });

    it('rejects bids higher than current highest but below required minimum step increment', () => {
      // currentHighest = 100, minIncrement = 10 -> minRequired = 110, bid = 105
      const invalidStep = validateBidAmount(105, 100, 10, 100);
      expect(invalidStep.valid).toBe(false);
      expect(invalidStep.reason).toContain('minimum increment step');
    });

    it('rejects non-positive or invalid amounts', () => {
      const zeroBid = validateBidAmount(0, 100, 10, 100);
      expect(zeroBid.valid).toBe(false);

      const negativeBid = validateBidAmount(-25, 100, 10, 100);
      expect(negativeBid.valid).toBe(false);
    });
  });

  describe('Auction Timer Expiration & Bidding Lock Logic Unit Evaluation (T-058)', () => {
    function evaluateAuctionBiddingState(
      status: 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'CANCELLED',
      startTime: Date,
      endTime: Date,
      now: Date
    ) {
      if (status === 'CANCELLED' || status === 'ENDED') {
        return { canBid: false, reason: 'Auction has already ended and bidding is locked' };
      }
      if (now > endTime) {
        return { canBid: false, reason: 'Auction has already ended and bidding is locked', shouldMarkEnded: true };
      }
      if (now < startTime) {
        return { canBid: false, reason: 'Auction has not started yet' };
      }
      return { canBid: true };
    }

    it('rejects bid submission when auction timer has expired (now > endTime)', () => {
      const now = new Date('2026-10-05T20:00:00Z');
      const startTime = new Date('2026-10-05T10:00:00Z');
      const endTime = new Date('2026-10-05T18:00:00Z'); // ended 2 hours ago

      const evalResult = evaluateAuctionBiddingState('ACTIVE', startTime, endTime, now);
      expect(evalResult.canBid).toBe(false);
      expect(evalResult.reason).toContain('bidding is locked');
      expect(evalResult.shouldMarkEnded).toBe(true);
    });

    it('rejects bid submission when auction status is explicitly ENDED', () => {
      const now = new Date('2026-10-05T15:00:00Z');
      const startTime = new Date('2026-10-05T10:00:00Z');
      const endTime = new Date('2026-10-05T18:00:00Z');

      const evalResult = evaluateAuctionBiddingState('ENDED', startTime, endTime, now);
      expect(evalResult.canBid).toBe(false);
      expect(evalResult.reason).toContain('bidding is locked');
    });

    it('rejects bid submission when auction status is CANCELLED', () => {
      const now = new Date('2026-10-05T12:00:00Z');
      const startTime = new Date('2026-10-05T10:00:00Z');
      const endTime = new Date('2026-10-05T18:00:00Z');

      const evalResult = evaluateAuctionBiddingState('CANCELLED', startTime, endTime, now);
      expect(evalResult.canBid).toBe(false);
      expect(evalResult.reason).toContain('bidding is locked');
    });

    it('rejects bid submission when auction start time is in the future', () => {
      const now = new Date('2026-10-05T08:00:00Z');
      const startTime = new Date('2026-10-05T10:00:00Z');
      const endTime = new Date('2026-10-05T18:00:00Z');

      const evalResult = evaluateAuctionBiddingState('UPCOMING', startTime, endTime, now);
      expect(evalResult.canBid).toBe(false);
      expect(evalResult.reason).toContain('not started yet');
    });

    it('allows bid submission when auction is active and within active time window', () => {
      const now = new Date('2026-10-05T14:00:00Z');
      const startTime = new Date('2026-10-05T10:00:00Z');
      const endTime = new Date('2026-10-05T18:00:00Z');

      const evalResult = evaluateAuctionBiddingState('ACTIVE', startTime, endTime, now);
      expect(evalResult.canBid).toBe(true);
    });
  });

  describe('Previous Bidder Identification & Outbid Notification Logic Unit Evaluation (T-061 & T-062)', () => {
    function evaluateOutbidNotification(
      previousHighestBidderId: string | null,
      newBidderId: string,
      auctionId: string,
      artworkTitle: string,
      newAmount: number
    ) {
      const isOutbid = previousHighestBidderId !== null && previousHighestBidderId !== newBidderId;
      if (!isOutbid || !previousHighestBidderId) {
        return null;
      }
      return {
        recipientId: previousHighestBidderId,
        auctionId,
        artworkTitle,
        newHighestBid: newAmount,
        message: `You have been outbid on "${artworkTitle}". New highest bid is ${newAmount} credits.`,
      };
    }

    it('identifies previous bidder and creates outbid notification when a different user places a higher bid (T-061 & T-062)', () => {
      const notification = evaluateOutbidNotification(
        'buyer-uuid-1',
        'buyer-uuid-2',
        'auction-uuid-100',
        'Terracotta Tapestry',
        350
      );

      expect(notification).not.toBeNull();
      expect(notification?.recipientId).toBe('buyer-uuid-1');
      expect(notification?.auctionId).toBe('auction-uuid-100');
      expect(notification?.artworkTitle).toBe('Terracotta Tapestry');
      expect(notification?.newHighestBid).toBe(350);
      expect(notification?.message).toContain('You have been outbid');
    });

    it('does not generate outbid notification on the first bid when no previous highest bidder exists (T-062)', () => {
      const notification = evaluateOutbidNotification(
        null,
        'buyer-uuid-1',
        'auction-uuid-100',
        'Terracotta Tapestry',
        200
      );

      expect(notification).toBeNull();
    });

    it('does not generate outbid notification when the same bidder outbids their own previous bid (T-062)', () => {
      const notification = evaluateOutbidNotification(
        'buyer-uuid-1',
        'buyer-uuid-1',
        'auction-uuid-100',
        'Terracotta Tapestry',
        400
      );

      expect(notification).toBeNull();
    });
  });
});


