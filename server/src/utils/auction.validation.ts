import { z } from 'zod';

export function toNumber(val: number | string | { toNumber(): number } | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
  }
  if (typeof val === 'object' && 'toNumber' in val && typeof (val as any).toNumber === 'function') {
    return (val as any).toNumber();
  }
  const num = Number(val);
  return isNaN(num) ? null : num;
}

export function roundToTwoDecimals(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates the next minimum required bid for an auction.
 * - If no bid exists yet (or currentHighestBid is null/0), the minimum bid is startingBid.
 * - If a current highest bid exists, the minimum bid is currentHighestBid + minIncrement.
 */
export function calculateMinimumBid(
  currentHighestBid: number | string | { toNumber(): number } | null | undefined,
  startingBid: number | string | { toNumber(): number },
  minIncrement: number | string | { toNumber(): number }
): number {
  const current = toNumber(currentHighestBid);
  const start = toNumber(startingBid) ?? 0;
  const inc = toNumber(minIncrement) ?? 10.0;

  if (current === null || current <= 0) {
    return roundToTwoDecimals(start);
  }

  return roundToTwoDecimals(current + inc);
}

export interface BidValidationResult {
  isValid: boolean;
  minRequiredBid: number;
  error?: string;
}

/**
 * Validates whether a proposed bid satisfies the required minimum step increment.
 */
export function validateBidStepIncrement(
  bidAmount: number | string | { toNumber(): number },
  currentHighestBid: number | string | { toNumber(): number } | null | undefined,
  startingBid: number | string | { toNumber(): number },
  minIncrement: number | string | { toNumber(): number }
): BidValidationResult {
  const amount = toNumber(bidAmount);
  const current = toNumber(currentHighestBid);
  const start = toNumber(startingBid) ?? 0;
  const inc = toNumber(minIncrement) ?? 10.0;

  const minRequiredBid = calculateMinimumBid(current, start, inc);

  if (amount === null || isNaN(amount) || amount <= 0) {
    return {
      isValid: false,
      minRequiredBid,
      error: 'Bid amount must be a positive number greater than zero credits.',
    };
  }

  const roundedAmount = roundToTwoDecimals(amount);

  if (roundedAmount < minRequiredBid) {
    if (current === null || current <= 0) {
      return {
        isValid: false,
        minRequiredBid,
        error: `Bid of ${roundedAmount.toFixed(2)} credits is below the opening starting bid of ${minRequiredBid.toFixed(2)} credits.`,
      };
    }

    return {
      isValid: false,
      minRequiredBid,
      error: `Bid of ${roundedAmount.toFixed(2)} credits does not meet the minimum increment. Must be at least ${minRequiredBid.toFixed(2)} credits (current highest bid: ${current.toFixed(2)} + minimum increment: ${inc.toFixed(2)}).`,
    };
  }

  return {
    isValid: true,
    minRequiredBid,
  };
}

export const placeBidSchema = z.object({
  amount: z
    .coerce
    .number()
    .positive('Bid amount must be greater than zero credits')
    .max(10000000, 'Bid amount cannot exceed 10,000,000 credits')
    .refine(
      (val) => Number(val.toFixed(2)) === val,
      'Bid amount cannot have more than 2 decimal places'
    ),
});

export const createAuctionSchema = z
  .object({
    artworkId: z.string().uuid('Invalid artwork ID format'),
    startingBid: z
      .coerce
      .number()
      .positive('Starting bid must be greater than zero credits')
      .max(10000000, 'Starting bid cannot exceed 10,000,000 credits'),
    minIncrement: z
      .coerce
      .number()
      .positive('Minimum increment must be greater than zero credits')
      .max(1000000, 'Minimum increment cannot exceed 1,000,000 credits')
      .default(10.0),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export type PlaceBidInput = z.infer<typeof placeBidSchema>;
export type CreateAuctionInput = z.infer<typeof createAuctionSchema>;
