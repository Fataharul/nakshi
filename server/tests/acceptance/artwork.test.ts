import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../../src/server';
import { prisma } from '../../src/config/prisma';

describe('Artwork Creation & Storefront Acceptance Tests (T-026 & T-038)', () => {
  let serverInstance: http.Server;
  let baseUrl: string;
  const uniqueId = Date.now();
  let artistToken: string;
  let secondArtistToken: string;
  let buyerToken: string;
  let createdArtworkId: string;

  const artistUser = {
    name: `Artisan Master ${uniqueId}`,
    email: `artist_artwork_${uniqueId}_${Math.random().toString(36).substring(2, 7)}@nakshi.test`,
    password: 'Password123!',
    role: 'ARTIST',
    bio: 'Master weaver of Sonargaon heritage Jamdani sarees.',
  };

  const secondArtistUser = {
    name: `Second Artisan ${uniqueId}`,
    email: `artist2_artwork_${uniqueId}_${Math.random().toString(36).substring(2, 7)}@nakshi.test`,
    password: 'Password123!',
    role: 'ARTIST',
    bio: 'Potter from Panchagarh.',
  };

  const buyerUser = {
    name: `Collector Buyer ${uniqueId}`,
    email: `buyer_artwork_${uniqueId}_${Math.random().toString(36).substring(2, 7)}@nakshi.test`,
    password: 'Password123!',
    role: 'BUYER',
  };

  beforeAll(async () => {
    // Start test server on dynamic open port
    await new Promise<void>((resolve) => {
      serverInstance = app.listen(0, () => {
        const address = serverInstance.address() as AddressInfo;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });

    // 1. Register Artist user
    const artistReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(artistUser),
    });
    const artistData = (await artistReg.json()) as any;
    artistToken = artistData.token;

    // 2. Register Second Artist user
    const secondArtistReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(secondArtistUser),
    });
    const secondArtistData = (await secondArtistReg.json()) as any;
    secondArtistToken = secondArtistData.token;

    // 3. Register Buyer user
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

  describe('PUT /api/artworks/:id (Edit Artwork - T-038 Access Restrictions)', () => {
    it('rejects unauthenticated edit request with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/artworks/${createdArtworkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Unauthenticated Update Attempt',
          price: 999,
        }),
      });

      expect(res.status).toBe(401);
    });

    it('rejects non-artist user (BUYER role) edit request with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/artworks/${createdArtworkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({
          title: 'Buyer Update Attempt',
          price: 999,
        }),
      });

      expect(res.status).toBe(403);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Forbidden');
    });

    it('rejects an artist attempting to edit another artist\'s artwork listing with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/artworks/${createdArtworkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secondArtistToken}`,
        },
        body: JSON.stringify({
          title: 'Unauthorized Cross-Artist Edit Attempt',
          price: 1500,
        }),
      });

      expect(res.status).toBe(403);
      const data = (await res.json()) as any;
      expect(data.error).toContain('You are not authorized to edit an artwork owned by another artist');
    });

    it('allows authentic storefront owner to successfully update their artwork listing with 200 OK', async () => {
      const res = await fetch(`${baseUrl}/api/artworks/${createdArtworkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${artistToken}`,
        },
        body: JSON.stringify({
          title: 'Updated Sonargaon Royal Jamdani Saree',
          price: 950.0,
          description: 'Updated description detailing imperial gold thread needlework.',
          availability: 'RESERVED',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.artwork).toBeDefined();
      expect(data.artwork.id).toBe(createdArtworkId);
      expect(data.artwork.title).toBe('Updated Sonargaon Royal Jamdani Saree');
      expect(data.artwork.price).toBe(950);
      expect(data.artwork.description).toBe('Updated description detailing imperial gold thread needlework.');
      expect(data.artwork.availability).toBe('RESERVED');
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
      expect(found.title).toBe('Updated Sonargaon Royal Jamdani Saree');
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

  describe('POST /api/artworks/upload (Image Upload)', () => {
    it('rejects unauthenticated upload request with 401 Unauthorized', async () => {
      const form = new FormData();
      const fakeBlob = new Blob(['image content'], { type: 'image/png' });
      form.append('image', fakeBlob, 'test.png');

      const res = await fetch(`${baseUrl}/api/artworks/upload`, {
        method: 'POST',
        body: form,
      });

      expect(res.status).toBe(401);
    });

    it('rejects BUYER role attempting image upload with 403 Forbidden', async () => {
      const form = new FormData();
      const fakeBlob = new Blob(['image content'], { type: 'image/png' });
      form.append('image', fakeBlob, 'test.png');

      const res = await fetch(`${baseUrl}/api/artworks/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${buyerToken}`,
        },
        body: form,
      });

      expect(res.status).toBe(403);
    });

    it('rejects upload request with no file attached with 400 Bad Request', async () => {
      const form = new FormData();

      const res = await fetch(`${baseUrl}/api/artworks/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${artistToken}`,
        },
        body: form,
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toBe('No image file provided for upload');
    });

    it('successfully uploads an image for authenticated ARTIST', async () => {
      const form = new FormData();
      const fakeBlob = new Blob(['valid-image-content-bytes'], { type: 'image/png' });
      form.append('image', fakeBlob, 'handicraft.png');

      const res = await fetch(`${baseUrl}/api/artworks/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${artistToken}`,
        },
        body: form,
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.imageUrl).toBeDefined();
      expect(data.key).toBeDefined();
      expect(data.key).toContain('artworks/');
      expect(data.key).toMatch(/\.png$/);
    });
  });

  afterAll(async () => {
    if (serverInstance) {
      await new Promise<void>((resolve) => {
        serverInstance.close(() => resolve());
      });
    }
  });
});

