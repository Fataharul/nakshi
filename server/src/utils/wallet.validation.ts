import { z } from 'zod';

export const topUpSchema = z.object({
  amount: z
    .coerce
    .number({ invalid_type_error: 'Top-up amount must be a number' })
    .positive('Top-up amount must be greater than zero')
    .max(100000, 'Maximum top-up amount is 100,000 Credits')
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: 'Amount cannot have more than 2 decimal places',
    }),
});

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type TopUpInput = z.infer<typeof topUpSchema>;
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>;
