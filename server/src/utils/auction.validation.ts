import { z } from 'zod';

export const createAuctionSchema = z.object({
  artworkId: z.string().uuid('Invalid artwork ID'),
  startingBid: z.number().positive('Starting bid must be positive'),
  minIncrement: z.number().positive('Minimum increment must be positive'),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start time format',
  }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid end time format',
  }),
}).refine(
  (data) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    return end > start;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

export type CreateAuctionInput = z.infer<typeof createAuctionSchema>;

/**
 * T-049: Bid submission payload validation.
 */
export const placeBidSchema = z.object({
  amount: z
    .number({
      required_error: 'Bid amount is required',
      invalid_type_error: 'Bid amount must be a number',
    })
    .positive('Bid amount must be greater than 0')
    .max(9999999999.99, 'Bid amount is too large')
    .refine((val) => Math.abs(val * 100 - Math.round(val * 100)) < 1e-6, {
      message: 'Bid amount can have at most 2 decimal places',
    }),
});

export type PlaceBidInput = z.infer<typeof placeBidSchema>;

/**
 * T-049: Auction e ekhon bid deya jay kina (start hoyeche, end hoyni, ENDED/CANCELLED na)
 */
export function isAuctionOpenForBidding(
  auction: { status: string; startTime: Date | string; endTime: Date | string },
  now: Date = new Date()
): boolean {
  if (auction.status === 'ENDED' || auction.status === 'CANCELLED') return false;
  const start = new Date(auction.startTime);
  const end = new Date(auction.endTime);
  return now >= start && now < end;
}

/**
 * T-049: Notun bid er minimum.
 * - Kono bid nai  -> starting bid er shoman ba beshi
 * - Bid ache      -> current highest bid er cheye beshi
 * (minIncrement step check T-050 er kaj)
 */
export function getMinimumAcceptableBid(startingBid: number, currentHighestBid: number | null): {
  amount: number;
  inclusive: boolean;
} {
  if (currentHighestBid === null || currentHighestBid === undefined) {
    return { amount: startingBid, inclusive: true };
  }
  return { amount: currentHighestBid, inclusive: false };
}
