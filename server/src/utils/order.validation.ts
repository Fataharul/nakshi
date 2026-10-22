import { z } from 'zod';

export const checkoutSchema = z.object({
  artworkId: z.string().min(1, 'Artwork ID is required'),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
