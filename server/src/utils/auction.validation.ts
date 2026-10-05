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

export const submitBidSchema = z.object({
  amount: z.coerce
    .number({
      required_error: 'Bid amount is required',
      invalid_type_error: 'Bid amount must be a number',
    })
    .positive('Bid amount must be positive'),
});

export type SubmitBidInput = z.infer<typeof submitBidSchema>;
