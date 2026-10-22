import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../../src/server';
import { prisma } from '../../src/config/prisma';
import { Prisma } from '@prisma/client';

describe('Fixed-Price Order Checkout Acceptance Tests', () => {
  let serverInstance: http.Server;
  let baseUrl: string;
  const uniqueId = Date.now();

  let artistToken: string;
  let artistId: string;

  let buyer1Token: string;
  let buyer1Id: string;

  let buyer2Token: string;
  let buyer2Id: string;

  let organizerToken: string;
  let organizerId: string;

  let artwork1Id: string;
  let artwork2Id: string;
  let artworkPrice = 500;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      serverInstance = app.listen(0, () => {
        const address = serverInstance.address() as AddressInfo;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });

    // 1. Register Artist
    const artistRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Artist ${uniqueId}`,
        email: `artist_${uniqueId}@nakshi.test`,
        password: 'Password123!',
        role: 'ARTIST',
      }),
    });
    const artistData = (await artistRes.json()) as any;
    artistToken = artistData.token;
    artistId = artistData.user.id;

    // 2. Register Buyer 1
    const buyer1Res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Buyer One ${uniqueId}`,
        email: `buyer1_${uniqueId}@nakshi.test`,
        password: 'Password123!',
        role: 'BUYER',
      }),
    });
    const buyer1Data = (await buyer1Res.json()) as any;
    buyer1Token = buyer1Data.token;
    buyer1Id = buyer1Data.user.id;

    // 3. Register Buyer 2
    const buyer2Res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Buyer Two ${uniqueId}`,
        email: `buyer2_${uniqueId}@nakshi.test`,
        password: 'Password123!',
        role: 'BUYER',
      }),
    });
    const buyer2Data = (await buyer2Res.json()) as any;
    buyer2Token = buyer2Data.token;
    buyer2Id = buyer2Data.user.id;

    // 4. Register Organizer
    const orgRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Organizer ${uniqueId}`,
        email: `org_${uniqueId}@nakshi.test`,
        password: 'Password123!',
        role: 'ORGANIZER',
      }),
    });
    const orgData = (await orgRes.json()) as any;
    organizerToken = orgData.token;
    organizerId = orgData.user.id;

    // 5. Create artwork 1
    const art1 = await prisma.artwork.create({
      data: {
        title: `Royal Jamdani Scroll ${uniqueId}`,
        description: 'Exquisite authentic handloom Jamdani work',
        medium: 'Handloom Jamdani',
        price: new Prisma.Decimal(artworkPrice.toFixed(2)),
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800',
        availability: 'AVAILABLE',
        moderationStatus: 'APPROVED',
        artistId,
      },
    });
    artwork1Id = art1.id;

    // 6. Create artwork 2
    const art2 = await prisma.artwork.create({
      data: {
        title: `Nakshi Kantha Tapestry ${uniqueId}`,
        description: 'Traditional handcrafted heirloom quilt',
        medium: 'Nakshi Kantha',
        price: new Prisma.Decimal('750.00'),
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800',
        availability: 'AVAILABLE',
        moderationStatus: 'APPROVED',
        artistId,
      },
    });
    artwork2Id = art2.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.creditTransaction.deleteMany({
      where: {
        wallet: {
          userId: { in: [artistId, buyer1Id, buyer2Id, organizerId] },
        },
      },
    }).catch(() => {});

    await prisma.order.deleteMany({
      where: {
        artworkId: { in: [artwork1Id, artwork2Id] },
      },
    }).catch(() => {});

    await prisma.artwork.deleteMany({
      where: {
        id: { in: [artwork1Id, artwork2Id] },
      },
    }).catch(() => {});

    await prisma.wallet.deleteMany({
      where: {
        userId: { in: [artistId, buyer1Id, buyer2Id, organizerId] },
      },
    }).catch(() => {});

    await prisma.user.deleteMany({
      where: {
        id: { in: [artistId, buyer1Id, buyer2Id, organizerId] },
      },
    }).catch(() => {});

    await new Promise<void>((resolve) => serverInstance.close(() => resolve()));
  });

  describe('POST /api/orders/checkout', () => {
    it('rejects unauthenticated checkout requests with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId: artwork1Id }),
      });
      expect(res.status).toBe(401);
    });

    it('rejects checkout requests from non-buyer/non-admin roles with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${organizerToken}`,
        },
        body: JSON.stringify({ artworkId: artwork1Id }),
      });
      expect(res.status).toBe(403);
    });

    it('rejects checkout with 400 Bad Request when buyer has insufficient credit balance', async () => {
      const res = await fetch(`${baseUrl}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyer1Token}`,
        },
        body: JSON.stringify({ artworkId: artwork1Id }),
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error || data.message).toMatch(/insufficient credit balance/i);
    });

    it('successfully purchases an artwork when buyer has sufficient credits', async () => {
      // Top up Buyer 1 with 1000 credits
      const topUpRes = await fetch(`${baseUrl}/api/wallet/top-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyer1Token}`,
        },
        body: JSON.stringify({ amount: 1000 }),
      });
      expect(topUpRes.status).toBe(200);

      // Perform checkout
      const checkoutRes = await fetch(`${baseUrl}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyer1Token}`,
        },
        body: JSON.stringify({ artworkId: artwork1Id }),
      });
      expect(checkoutRes.status).toBe(201);
      const checkoutData = (await checkoutRes.json()) as any;

      expect(checkoutData.message).toMatch(/order completed successfully/i);
      expect(checkoutData.order).toBeDefined();
      expect(checkoutData.order.artworkId).toBe(artwork1Id);
      expect(checkoutData.order.buyerId).toBe(buyer1Id);
      expect(checkoutData.order.sellerId).toBe(artistId);
      expect(checkoutData.order.amountPaid).toBe(500);
      expect(checkoutData.newWalletBalance).toBe(500); // 1000 - 500 = 500

      // Verify artwork availability in database is now SOLD
      const dbArtwork = await prisma.artwork.findUnique({ where: { id: artwork1Id } });
      expect(dbArtwork?.availability).toBe('SOLD');

      // Verify seller received 500 credits
      const sellerWallet = await prisma.wallet.findUnique({ where: { userId: artistId } });
      expect(Number(sellerWallet?.balance)).toBe(500);

      // Verify credit transactions audit log
      const buyerTx = await prisma.creditTransaction.findFirst({
        where: {
          wallet: { userId: buyer1Id },
          type: 'PURCHASE_DEBIT',
        },
      });
      expect(buyerTx).toBeDefined();
      expect(Number(buyerTx?.amount)).toBe(500);

      const sellerTx = await prisma.creditTransaction.findFirst({
        where: {
          wallet: { userId: artistId },
          type: 'SALE_CREDIT',
        },
      });
      expect(sellerTx).toBeDefined();
      expect(Number(sellerTx?.amount)).toBe(500);
    });

    it('rejects attempt to buy an already SOLD artwork with 409 Conflict', async () => {
      // Buyer 1 attempts to buy artwork 1 again
      const res = await fetch(`${baseUrl}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyer1Token}`,
        },
        body: JSON.stringify({ artworkId: artwork1Id }),
      });
      expect(res.status).toBe(409);
      const data = (await res.json()) as any;
      expect(data.error || data.message).toMatch(/no longer available/i);
    });

    it('prevents concurrent double-purchasing of the same piece across multiple buyers', async () => {
      // Top up Buyer 1 and Buyer 2 with 1000 credits each
      await fetch(`${baseUrl}/api/wallet/top-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyer1Token}`,
        },
        body: JSON.stringify({ amount: 1000 }),
      });
      await fetch(`${baseUrl}/api/wallet/top-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyer2Token}`,
        },
        body: JSON.stringify({ amount: 1000 }),
      });

      // Both buyers execute simultaneous checkout for Artwork 2
      const [res1, res2] = await Promise.all([
        fetch(`${baseUrl}/api/orders/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${buyer1Token}`,
          },
          body: JSON.stringify({ artworkId: artwork2Id }),
        }),
        fetch(`${baseUrl}/api/orders/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${buyer2Token}`,
          },
          body: JSON.stringify({ artworkId: artwork2Id }),
        }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      // Exactly one request must succeed (201 Created) and one must be rejected (409 Conflict)
      expect(statuses).toEqual([201, 409]);

      // Exactly 1 order must exist in DB for artwork 2
      const orders = await prisma.order.findMany({ where: { artworkId: artwork2Id } });
      expect(orders.length).toBe(1);
    });
  });

  describe('GET /api/orders/my-orders', () => {
    it('returns chronological list of purchased orders for authenticated buyer', async () => {
      const res = await fetch(`${baseUrl}/api/orders/my-orders?page=1&limit=10`, {
        headers: {
          Authorization: `Bearer ${buyer1Token}`,
        },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;

      expect(data.orders).toBeDefined();
      expect(Array.isArray(data.orders)).toBe(true);
      expect(data.orders.length).toBeGreaterThanOrEqual(1);
      expect(data.orders[0].buyerId).toBe(buyer1Id);
      expect(data.orders[0].artwork).toBeDefined();
      expect(data.pagination).toBeDefined();
    });
  });
});
