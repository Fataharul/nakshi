import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../../src/server';
import { prisma } from '../../src/config/prisma';
import { Role, AuctionStatus } from '@prisma/client';

describe('Auction Bidding & Step Increment Acceptance Tests', () => {
  let serverInstance: http.Server;
  let baseUrl: string;
  const uniqueId = Date.now();

  let adminToken: string;
  let adminId: string;
  let artistToken: string;
  let artistId: string;
  let buyer1Token: string;
  let buyer1Id: string;
  let buyer2Token: string;
  let buyer2Id: string;
  let poorBuyerToken: string;
  let poorBuyerId: string;

  let testArtworkId: string;
  let testAuctionId: string;
  let closedAuctionId: string;

  beforeAll(async () => {
    // 1. Start test server on dynamic port
    await new Promise<void>((resolve) => {
      serverInstance = app.listen(0, () => {
        const address = serverInstance.address() as AddressInfo;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });

    // 2. Register Artist
    const artistRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Auction Artisan ${uniqueId}`,
        email: `artist_auc_${uniqueId}@nakshi.test`,
        password: 'Password123!',
        role: 'ARTIST',
        bio: 'Master terracotta sculptor.',
      }),
    });
    const artistData = (await artistRes.json()) as any;
    artistToken = artistData.token;
    artistId = artistData.user.id;

    // 3. Register Buyer 1
    const buyer1Res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Bidder Alpha ${uniqueId}`,
        email: `buyer1_auc_${uniqueId}@nakshi.test`,
        password: 'Password123!',
        role: 'BUYER',
      }),
    });
    const buyer1Data = (await buyer1Res.json()) as any;
    buyer1Token = buyer1Data.token;
    buyer1Id = buyer1Data.user.id;

    // 4. Register Buyer 2
    const buyer2Res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Bidder Beta ${uniqueId}`,
        email: `buyer2_auc_${uniqueId}@nakshi.test`,
        password: 'Password123!',
        role: 'BUYER',
      }),
    });
    const buyer2Data = (await buyer2Res.json()) as any;
    buyer2Token = buyer2Data.token;
    buyer2Id = buyer2Data.user.id;

    // 5. Register Poor Buyer (0 credits)
    const poorBuyerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Bidder Zero ${uniqueId}`,
        email: `poor_buyer_auc_${uniqueId}@nakshi.test`,
        password: 'Password123!',
        role: 'BUYER',
      }),
    });
    const poorBuyerData = (await poorBuyerRes.json()) as any;
    poorBuyerToken = poorBuyerData.token;
    poorBuyerId = poorBuyerData.user.id;

    // 6. Give Buyer 1 and Buyer 2 internal test credits
    await prisma.wallet.update({
      where: { userId: buyer1Id },
      data: { balance: 5000.0 },
    });
    await prisma.wallet.update({
      where: { userId: buyer2Id },
      data: { balance: 5000.0 },
    });

    // 7. Create Admin user for auction creation tests
    const adminUser = await prisma.user.create({
      data: {
        name: `Admin Curator ${uniqueId}`,
        email: `admin_auc_${uniqueId}@nakshi.test`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: Role.ADMIN,
        wallet: { create: { balance: 0.0 } },
      },
    });
    adminId = adminUser.id;

    // Generate JWT for Admin
    const jwt = await import('jsonwebtoken');
    adminToken = jwt.default.sign(
      { id: adminId, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || 'nakshi-dev-secret-key-change-in-production-2026',
      { expiresIn: '1h' }
    );

    // 8. Create an artwork by the Artist
    const artwork = await prisma.artwork.create({
      data: {
        artistId,
        title: `Heirloom Terracotta Plaque ${uniqueId}`,
        description: 'Traditional Bengal folk art relief carved in riverbed terracotta clay.',
        medium: 'Terracotta Clay',
        price: 500.0,
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        moderationStatus: 'APPROVED',
      },
    });
    testArtworkId = artwork.id;

    // 9. Create an active test auction (Starting bid: 200.00, Min increment: 20.00)
    const now = new Date();
    const activeAuction = await prisma.auction.create({
      data: {
        artworkId: testArtworkId,
        startingBid: 200.0,
        minIncrement: 20.0,
        startTime: new Date(now.getTime() - 60000), // started 1 min ago
        endTime: new Date(now.getTime() + 3600000), // ends in 1 hr
        status: AuctionStatus.ACTIVE,
      },
    });
    testAuctionId = activeAuction.id;

    // 10. Create an ended auction
    const endedAuction = await prisma.auction.create({
      data: {
        artworkId: testArtworkId,
        startingBid: 100.0,
        minIncrement: 10.0,
        startTime: new Date(now.getTime() - 7200000),
        endTime: new Date(now.getTime() - 3600000),
        status: AuctionStatus.ENDED,
      },
    });
    closedAuctionId = endedAuction.id;
  });

  describe('GET /api/auctions/:id', () => {
    it('retrieves auction details with correct initial minNextBid equal to startingBid', async () => {
      const res = await fetch(`${baseUrl}/api/auctions/${testAuctionId}`);
      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.auction).toBeDefined();
      expect(data.auction.id).toBe(testAuctionId);
      expect(data.auction.startingBid).toBe(200);
      expect(data.auction.minIncrement).toBe(20);
      expect(data.auction.currentHighestBid).toBeNull();
      expect(data.auction.minNextBid).toBe(200); // Opening minNextBid is startingBid
    });

    it('returns 404 for non-existent auction ID', async () => {
      const res = await fetch(`${baseUrl}/api/auctions/00000000-0000-0000-0000-000000000000`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/auctions/:id/bid (Step Increment & Validation Enforcement)', () => {
    it('rejects unauthenticated bid submission with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/auctions/${testAuctionId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 200 }),
      });
      expect(res.status).toBe(401);
    });

    it('rejects bid from non-BUYER role (ARTIST) with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/auctions/${testAuctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${artistToken}`,
        },
        body: JSON.stringify({ amount: 200 }),
      });
      expect(res.status).toBe(403);
    });

    it('rejects opening bid below the starting bid with 400 Bad Request', async () => {
      // Starting bid is 200, submitting 150
      const res = await fetch(`${baseUrl}/api/auctions/${testAuctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyer1Token}`,
        },
        body: JSON.stringify({ amount: 150 }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toBeDefined();
      expect(data.error).toContain('below the opening starting bid of 200.00 credits');
    });

    it('rejects bid with invalid format (e.g. more than 2 decimal places)', async () => {
      const res = await fetch(`${baseUrl}/api/auctions/${testAuctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyer1Token}`,
        },
        body: JSON.stringify({ amount: 200.555 }),
      });

      expect(res.status).toBe(400);
    });

    it('rejects bid if buyer has insufficient credits', async () => {
      // poorBuyer has 0 credits
      const res = await fetch(`${baseUrl}/api/auctions/${testAuctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${poorBuyerToken}`,
        },
        body: JSON.stringify({ amount: 200 }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Insufficient credit balance');
    });

    it('successfully accepts valid opening bid meeting starting bid', async () => {
      // Opening bid of exactly 200.00 credits
      const res = await fetch(`${baseUrl}/api/auctions/${testAuctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyer1Token}`,
        },
        body: JSON.stringify({ amount: 200.0 }),
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.bid).toBeDefined();
      expect(data.bid.amount).toBe(200);
      expect(data.bid.bidderId).toBe(buyer1Id);
      expect(data.auction.currentHighestBid).toBe(200);
      expect(data.auction.minNextBid).toBe(220); // 200 + 20 minIncrement
    });

    it('rejects subsequent bid below currentHighestBid + minIncrement', async () => {
      // Current highest bid is 200, minIncrement is 20 -> minimum required next bid is 220
      // Buyer 2 bids 210 (which is > 200, but < 220)
      const res = await fetch(`${baseUrl}/api/auctions/${testAuctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyer2Token}`,
        },
        body: JSON.stringify({ amount: 210.0 }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toContain('does not meet the minimum increment');
      expect(data.error).toContain('Must be at least 220.00 credits');
    });

    it('successfully accepts subsequent bid meeting the minimum increment', async () => {
      // Buyer 2 bids 220.00 (exact minimum required bid)
      const res = await fetch(`${baseUrl}/api/auctions/${testAuctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyer2Token}`,
        },
        body: JSON.stringify({ amount: 220.0 }),
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.bid.amount).toBe(220);
      expect(data.bid.bidderId).toBe(buyer2Id);
      expect(data.auction.currentHighestBid).toBe(220);
      expect(data.auction.minNextBid).toBe(240); // 220 + 20
    });

    it('successfully accepts jump bid exceeding the minimum increment', async () => {
      // Buyer 1 submits a jump bid of 300.00 (> 240)
      const res = await fetch(`${baseUrl}/api/auctions/${testAuctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyer1Token}`,
        },
        body: JSON.stringify({ amount: 300.0 }),
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.bid.amount).toBe(300);
      expect(data.auction.currentHighestBid).toBe(300);
      expect(data.auction.minNextBid).toBe(320);
    });

    it('rejects bids submitted to an ended auction', async () => {
      const res = await fetch(`${baseUrl}/api/auctions/${closedAuctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyer1Token}`,
        },
        body: JSON.stringify({ amount: 200 }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toContain('auction has closed');
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
