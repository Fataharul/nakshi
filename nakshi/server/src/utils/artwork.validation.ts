import { z } from 'zod';

export const CRAFT_MEDIUMS = [
  'Nakshi Kantha',
  'Terracotta Clay',
  'Handloom Jamdani',
  'Brass & Bell Metal',
  'Folk Painting & Patua',
  'Wood Carving & Inlay',
  'Shital Pati Cane Weave',
  'Ceramic & Traditional Pottery',
  'Jute Fiber Craft',
  'Leather Craft',
  'Other Traditional Craft',
] as const;

const optionalPositiveNumber = z
  .union([
    z.coerce.number().positive('Must be greater than zero'),
    z.literal(''),
    z.null(),
    z.undefined(),
  ])
  .transform((val) => (val === '' || val === undefined || val === null || Number.isNaN(val) ? null : Number(val)));

export const createArtworkSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(120, 'Title cannot exceed 120 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters detailing the craft')
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim(),
  medium: z
    .string()
    .min(2, 'Craft medium is required')
    .max(100, 'Craft medium cannot exceed 100 characters')
    .trim(),
  dimensions: z
    .string()
    .max(100, 'Dimensions cannot exceed 100 characters')
    .trim()
    .optional()
    .nullable(),
  height: optionalPositiveNumber,
  width: optionalPositiveNumber,
  depth: optionalPositiveNumber,
  weight: optionalPositiveNumber,
  weightUnit: z
    .string()
    .max(20, 'Weight unit cannot exceed 20 characters')
    .trim()
    .optional()
    .nullable(),
  price: z
    .coerce
    .number()
    .positive('Price must be greater than zero credits')
    .max(1000000, 'Price cannot exceed 1,000,000 credits'),
  imageUrl: z
    .string()
    .url('Please provide a valid image URL')
    .optional()
    .or(z.literal('')),
  availability: z
    .enum(['AVAILABLE', 'RESERVED', 'SOLD'])
    .default('AVAILABLE'),
});

export const updateArtworkSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(120, 'Title cannot exceed 120 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim()
    .optional(),
  medium: z
    .string()
    .min(2, 'Craft medium is required')
    .max(100, 'Craft medium cannot exceed 100 characters')
    .trim()
    .optional(),
  dimensions: z
    .string()
    .max(100, 'Dimensions cannot exceed 100 characters')
    .trim()
    .optional()
    .nullable(),
  height: optionalPositiveNumber,
  width: optionalPositiveNumber,
  depth: optionalPositiveNumber,
  weight: optionalPositiveNumber,
  weightUnit: z
    .string()
    .max(20, 'Weight unit cannot exceed 20 characters')
    .trim()
    .optional()
    .nullable(),
  price: z
    .coerce
    .number()
    .positive('Price must be greater than zero credits')
    .max(1000000, 'Price cannot exceed 1,000,000 credits')
    .optional(),
  imageUrl: z
    .string()
    .url('Please provide a valid image URL')
    .optional()
    .or(z.literal('')),
  availability: z
    .enum(['AVAILABLE', 'RESERVED', 'SOLD'])
    .optional(),
});

export const artworkQuerySchema = z.object({
  medium: z.string().optional(),
  availability: z.enum(['ALL', 'AVAILABLE', 'RESERVED', 'SOLD']).default('AVAILABLE'),
  search: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateArtworkInput = z.infer<typeof createArtworkSchema>;
export type UpdateArtworkInput = z.infer<typeof updateArtworkSchema>;
export type ArtworkQueryInput = z.infer<typeof artworkQuerySchema>;
