import { describe, it, expect } from 'vitest';
import { createArtworkSchema, updateArtworkSchema } from '../../src/utils/artwork.validation';

describe('Artwork Validation Schema Unit Tests', () => {
  it('accepts valid artwork creation payload', () => {
    const validData = {
      title: 'Sonargaon Jamdani Tapestry',
      description: 'Handwoven heritage silk Jamdani quilt featuring floral motifs.',
      medium: 'Handloom Jamdani',
      dimensions: '72 x 48 inches',
      price: 1250.5,
      imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119',
      availability: 'AVAILABLE',
    };

    const parsed = createArtworkSchema.parse(validData);
    expect(parsed.title).toBe('Sonargaon Jamdani Tapestry');
    expect(parsed.medium).toBe('Handloom Jamdani');
    expect(parsed.price).toBe(1250.5);
  });

  it('rejects artwork creation payload with title less than 2 characters', () => {
    const result = createArtworkSchema.safeParse({
      title: 'A',
      description: 'Handwoven heritage silk Jamdani quilt featuring floral motifs.',
      medium: 'Handloom Jamdani',
      price: 100,
    });

    expect(result.success).toBe(false);
  });

  it('rejects negative or zero price values', () => {
    const zeroPrice = createArtworkSchema.safeParse({
      title: 'Valid Artwork Title',
      description: 'Handwoven heritage silk Jamdani quilt featuring floral motifs.',
      medium: 'Handloom Jamdani',
      price: 0,
    });
    expect(zeroPrice.success).toBe(false);

    const negativePrice = createArtworkSchema.safeParse({
      title: 'Valid Artwork Title',
      description: 'Handwoven heritage silk Jamdani quilt featuring floral motifs.',
      medium: 'Handloom Jamdani',
      price: -50,
    });
    expect(negativePrice.success).toBe(false);
  });

  it('rejects descriptions shorter than 10 characters', () => {
    const result = createArtworkSchema.safeParse({
      title: 'Valid Artwork Title',
      description: 'Short',
      medium: 'Terracotta Clay',
      price: 250,
    });

    expect(result.success).toBe(false);
  });

  it('coerces string price values to numeric format', () => {
    const parsed = createArtworkSchema.parse({
      title: 'Terracotta Horse Sculpture',
      description: 'Hand-molded terracotta folk art sculpture from Panchagarh.',
      medium: 'Terracotta Clay',
      price: '350.00',
    });

    expect(parsed.price).toBe(350);
  });

  it('validates and parses artwork weight and detailed physical dimensions', () => {
    const parsed = createArtworkSchema.parse({
      title: 'Terracotta Elephant Figurine',
      description: 'Handcrafted terracotta folk artifact.',
      medium: 'Terracotta Clay',
      price: 450,
      weight: '3.75',
      weightUnit: 'kg',
      height: '35.5',
      width: '20.0',
      depth: '15.0',
      dimensions: '35.5 x 20 x 15 cm',
    });

    expect(parsed.weight).toBe(3.75);
    expect(parsed.weightUnit).toBe('kg');
    expect(parsed.height).toBe(35.5);
    expect(parsed.width).toBe(20);
    expect(parsed.depth).toBe(15);
    expect(parsed.dimensions).toBe('35.5 x 20 x 15 cm');
  });

  it('rejects negative weight and invalid dimension values', () => {
    const negativeWeight = createArtworkSchema.safeParse({
      title: 'Valid Artwork Title',
      description: 'Handwoven heritage silk Jamdani quilt featuring floral motifs.',
      medium: 'Handloom Jamdani',
      price: 100,
      weight: -2.5,
    });
    expect(negativeWeight.success).toBe(false);

    const negativeHeight = createArtworkSchema.safeParse({
      title: 'Valid Artwork Title',
      description: 'Handwoven heritage silk Jamdani quilt featuring floral motifs.',
      medium: 'Handloom Jamdani',
      price: 100,
      height: -10,
    });
    expect(negativeHeight.success).toBe(false);
  });
});
