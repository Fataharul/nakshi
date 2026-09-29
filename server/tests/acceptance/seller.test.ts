import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../../src/server';
import { prisma } from '../../src/config/prisma';

describe('Seller Sales Performance Metrics Acceptance Tests (T-034)', () => {
  let serverInstance: http.Server;
  let baseUrl: string;
  const uniqueId = Date.now();
  let artistToken: string;
  let artistId: string;
  let buyerToken: string;
  let buyerId: string;
  let artworkId: string;

  const artistUser = {
    name: `Artisan Seller ${uniqueId}`,
    email: `seller_metrics_${uniqueId}@nakshi.test`,
    password: 'Password123!',
    role: 'ARTIST',
    bio: 'Master weaver of Nakshi Kantha tapestries.',
  };

  const buyerUser = {
    name: `Buyer Collector ${uniqueId}`,
    email: `buyer_metrics_${uniqueId}@nakshi.test`,
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
    artistId = artistData.user.id;

    // 2. Register Buyer user
    const buyerReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buyerUser),
    });
    const buyerData = (await buyerReg.json()) as any;
    buyerToken = buyerData.token;
    buyerId = buyerData.user.id;

    // 3. Seed an artwork for artist directly in database
    const artwork = await prisma.artwork.create({
      data: {
        artistId,
        title: `Sonargaon Folk Quilt ${uniqueId}`,
        description: 'Authentic handcrafted Nakshi Kantha quilt featuring floral motifs.',
        medium: 'Nakshi Kantha',
        price: 750.0,
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119',
        availability: 'SOLD',
        moderationStatus: 'APPROVED',
      },
    });
    artworkId = artwork.id;

    // 4. Seed a completed order for artist directly in database
    await prisma.order.create({
      data: {
        buyerId,
        sellerId: artistId,
        artworkId,
        amountPaid: 750.0,
      },
    });
  });

  describe('GET /api/seller/metrics', () => {
    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/seller/metrics`);
      expect(res.status).toBe(401);
    });

    it('rejects BUYER role request with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/seller/metrics`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });

      expect(res.status).toBe(403);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Forbidden');
    });

    it('returns accurate sales metrics and recent order logs for authenticated ARTIST', async () => {
      const res = await fetch(`${baseUrl}/api/seller/metrics`, {
        headers: { Authorization: `Bearer ${artistToken}` },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;

      expect(data.seller).toBeDefined();
      expect(data.seller.id).toBe(artistId);

      expect(data.metrics).toBeDefined();
      expect(data.metrics.totalRevenue).toBe(750);
      expect(data.metrics.totalOrders).toBe(1);
      expect(data.metrics.averageOrderValue).toBe(750);
      expect(data.metrics.soldArtworks).toBe(1);

      expect(Array.isArray(data.recentSales)).toBe(true);
      expect(data.recentSales.length).toBe(1);
      expect(data.recentSales[0].artworkTitle).toContain('Sonargaon Folk Quilt');
      expect(data.recentSales[0].amountPaid).toBe(750);
      expect(data.recentSales[0].buyerName).toBe(buyerUser.name);
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
