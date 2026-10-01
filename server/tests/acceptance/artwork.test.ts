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

  describe('GET /api/artworks (Medium & Style Filtering - T-042)', () => {
    let kanthaArtworkId: string;
    let terracottaArtworkId: string;

    beforeAll(async () => {
      // Create Artwork 1: Nakshi Kantha with Traditional Folk style
      const kanthaRes = await fetch(`${baseUrl}/api/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${artistToken}`,
        },
        body: JSON.stringify({
          title: `Filter Test Kantha ${uniqueId}`,
          description: 'Traditional folk handcrafted quilt from Jessore.',
          medium: 'Nakshi Kantha',
          style: 'Traditional Folk',
          price: 600,
        }),
      });
      const kanthaData = (await kanthaRes.json()) as any;
      kanthaArtworkId = kanthaData.artwork.id;

      // Create Artwork 2: Terracotta Clay with Sculptural & Relic style
      const terracottaRes = await fetch(`${baseUrl}/api/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${artistToken}`,
        },
        body: JSON.stringify({
          title: `Filter Test Terracotta ${uniqueId}`,
          description: 'Sculptural terracotta ancient horse relic figurine.',
          medium: 'Terracotta Clay',
          style: 'Sculptural & Relic',
          price: 400,
        }),
      });
      const terracottaData = (await terracottaRes.json()) as any;
      terracottaArtworkId = terracottaData.artwork.id;
    });

    it('returns all artworks when no filter parameters are supplied', async () => {
      const res = await fetch(`${baseUrl}/api/artworks`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(Array.isArray(data.artworks)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.artworks.length).toBeGreaterThanOrEqual(2);
    });

    it('filters artworks strictly by medium', async () => {
      const res = await fetch(`${baseUrl}/api/artworks?medium=Nakshi%20Kantha`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.artworks.length).toBeGreaterThanOrEqual(1);
      data.artworks.forEach((art: any) => {
        expect(art.medium.toLowerCase()).toBe('nakshi kantha');
      });
      const found = data.artworks.find((art: any) => art.id === kanthaArtworkId);
      expect(found).toBeDefined();
    });

    it('filters artworks strictly by style', async () => {
      const res = await fetch(`${baseUrl}/api/artworks?style=Sculptural%20%26%20Relic`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.artworks.length).toBeGreaterThanOrEqual(1);
      data.artworks.forEach((art: any) => {
        expect(art.style?.toLowerCase()).toBe('sculptural & relic');
      });
      const found = data.artworks.find((art: any) => art.id === terracottaArtworkId);
      expect(found).toBeDefined();
    });

    it('filters artworks by combining both medium and style criteria', async () => {
      const res = await fetch(`${baseUrl}/api/artworks?medium=Terracotta%20Clay&style=Sculptural%20%26%20Relic`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.artworks.length).toBeGreaterThanOrEqual(1);
      data.artworks.forEach((art: any) => {
        expect(art.medium.toLowerCase()).toBe('terracotta clay');
        expect(art.style?.toLowerCase()).toBe('sculptural & relic');
      });

      const found = data.artworks.find((art: any) => art.id === terracottaArtworkId);
      expect(found).toBeDefined();
    });

    it('returns empty array when no artworks match combined medium and style filter', async () => {
      const res = await fetch(`${baseUrl}/api/artworks?medium=Handloom%20Jamdani&style=Sculptural%20%26%20Relic`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.artworks.length).toBe(0);
    });
  });

  describe('DELETE /api/artworks/:id (Storefront Deletion - T-045)', () => {
    let artworkToDeleteId: string;

    beforeAll(async () => {
      // Create an artwork specifically for delete testing
      const res = await fetch(`${baseUrl}/api/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${artistToken}`,
        },
        body: JSON.stringify({
          title: 'Artwork To Delete Test',
          description: 'Temporary listing created to verify delete endpoint authorization.',
          medium: 'Clay Pottery',
          price: 250.0,
          imageUrl: 'https://example.com/test-delete.jpg',
        }),
      });
      const data = (await res.json()) as any;
      artworkToDeleteId = data.artwork.id;
    });

    it('rejects unauthenticated delete request with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/artworks/${artworkToDeleteId}`, {
        method: 'DELETE',
      });
      expect(res.status).toBe(401);
    });

    it('rejects non-artist user (BUYER role) with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/artworks/${artworkToDeleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${buyerToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('rejects an artist attempting to delete another artist\'s artwork with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/artworks/${artworkToDeleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${secondArtistToken}` },
      });
      expect(res.status).toBe(403);
      const data = (await res.json()) as any;
      expect(data.error).toContain('You are not authorized to delete an artwork owned by another artist');
    });

    it('rejects deleting an artwork that is marked SOLD with 400 Bad Request', async () => {
      // Update availability to SOLD in DB
      await prisma.artwork.update({
        where: { id: artworkToDeleteId },
        data: { availability: 'SOLD' },
      });

      const res = await fetch(`${baseUrl}/api/artworks/${artworkToDeleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${artistToken}` },
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Cannot delete an artwork that has already been purchased');

      // Restore to AVAILABLE
      await prisma.artwork.update({
        where: { id: artworkToDeleteId },
        data: { availability: 'AVAILABLE' },
      });
    });

    it('allows authentic storefront owner to successfully delete their artwork listing with 200 OK', async () => {
      const res = await fetch(`${baseUrl}/api/artworks/${artworkToDeleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${artistToken}` },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.message).toBe('Artwork deleted successfully');

      // Verify it no longer exists
      const verifyRes = await fetch(`${baseUrl}/api/artworks/${artworkToDeleteId}`);
      expect(verifyRes.status).toBe(404);
    });

    it('returns 404 when attempting to delete a non-existent artwork', async () => {
      const res = await fetch(`${baseUrl}/api/artworks/00000000-0000-0000-0000-000000000000`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${artistToken}` },
      });
      expect(res.status).toBe(404);
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


