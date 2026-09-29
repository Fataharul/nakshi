import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../src/config/prisma';

const baseUrl = process.env.TEST_API_URL || 'http://localhost:5000';

describe('Artwork Creation & Storefront Acceptance Tests (T-026)', () => {
  const uniqueId = Date.now();
  let artistToken: string;
  let buyerToken: string;
  let createdArtworkId: string;

  const artistUser = {
    name: `Artisan Master ${uniqueId}`,
    email: `artist_${uniqueId}@nakshi.test`,
    password: 'Password123!',
    role: 'ARTIST',
    bio: 'Master weaver of Sonargaon heritage Jamdani sarees.',
  };

  const buyerUser = {
    name: `Collector Buyer ${uniqueId}`,
    email: `buyer_${uniqueId}@nakshi.test`,
    password: 'Password123!',
    role: 'BUYER',
  };

  beforeAll(async () => {
    // 1. Register Artist user
    const artistReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(artistUser),
    });
    const artistData = (await artistReg.json()) as any;
    artistToken = artistData.token;

    // 2. Register Buyer user
    const buyerReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buyerUser),
    });
    const buyerData = (await buyerReg.json()) as any;
    buyerToken = buyerData.token;
  });

  describe('POST /api/artworks (Create Artwork)', () => {
    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/artworks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Unauthenticated Craft',
          description: 'Handwoven heritage craft details.',
          medium: 'Handloom Jamdani',
          price: 500,
        }),
      });

      expect(res.status).toBe(401);
    });

    it('rejects BUYER role with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({
          title: 'Buyer Attempted Craft',
          description: 'Handwoven heritage craft details.',
          medium: 'Handloom Jamdani',
          price: 500,
        }),
      });

      expect(res.status).toBe(403);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Forbidden');
    });

    it('rejects invalid payload with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${artistToken}`,
        },
        body: JSON.stringify({
          title: 'A', // Too short
          description: 'Short', // Too short
          medium: '',
          price: -100, // Invalid negative price
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toBe('Validation failed');
    });

    it('successfully creates a new artwork record with weight and dimensions when executed by ARTIST', async () => {
      const res = await fetch(`${baseUrl}/api/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${artistToken}`,
        },
        body: JSON.stringify({
          title: 'Sonargaon Heritage Jamdani Saree',
          description: 'Authentic 200-count cotton & gold thread handloom Jamdani woven in Narayanganj.',
          medium: 'Handloom Jamdani',
          dimensions: '5.5 meters x 1.2 meters',
          height: 550,
          width: 120,
          depth: 0.5,
          weight: 1.25,
          weightUnit: 'kg',
          price: 850.0,
          imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119',
          availability: 'AVAILABLE',
        }),
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.artwork).toBeDefined();
      expect(data.artwork.id).toBeDefined();
      expect(data.artwork.title).toBe('Sonargaon Heritage Jamdani Saree');
      expect(data.artwork.price).toBe(850);
      expect(data.artwork.weight).toBe(1.25);
      expect(data.artwork.weightUnit).toBe('kg');
      expect(data.artwork.height).toBe(550);
      expect(data.artwork.width).toBe(120);
      expect(data.artwork.depth).toBe(0.5);
      expect(data.artwork.dimensions).toBe('5.5 meters x 1.2 meters');
      expect(data.artwork.availability).toBe('AVAILABLE');
      expect(data.artwork.moderationStatus).toBe('APPROVED');
      expect(data.artwork.artist).toBeDefined();
      expect(data.artwork.artist.email).toBe(artistUser.email);

      createdArtworkId = data.artwork.id;
    });
  });

  describe('GET /api/artworks/my-artworks', () => {
    it('returns published artworks for authenticated ARTIST', async () => {
      const res = await fetch(`${baseUrl}/api/artworks/my-artworks`, {
        headers: { Authorization: `Bearer ${artistToken}` },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(Array.isArray(data.artworks)).toBe(true);
      expect(data.artworks.length).toBeGreaterThanOrEqual(1);

      const found = data.artworks.find((a: any) => a.id === createdArtworkId);
      expect(found).toBeDefined();
      expect(found.title).toBe('Sonargaon Heritage Jamdani Saree');
    });
  });

  describe('GET /api/artworks/storefront/:artistId', () => {
    it('returns public storefront profile, artworks, and stats', async () => {
      const dbArtist = await prisma.user.findUnique({
        where: { email: artistUser.email },
      });

      expect(dbArtist).toBeDefined();

      const res = await fetch(`${baseUrl}/api/artworks/storefront/${dbArtist!.id}`);
      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.artist).toBeDefined();
      expect(data.artist.email).toBe(artistUser.email);
      expect(Array.isArray(data.artworks)).toBe(true);
      expect(data.stats).toBeDefined();
      expect(data.stats.totalArtworks).toBeGreaterThanOrEqual(1);
    });
  });
});
