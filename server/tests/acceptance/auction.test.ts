import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../../src/server';
import { prisma } from '../../src/config/prisma';
import { AuthService } from '../../src/services/auth.service';
import bcrypt from 'bcrypt';

describe('Auction Creation & Seller Management Acceptance Tests', () => {
  let serverInstance: http.Server;
  let baseUrl: string;
  const uniqueId = Date.now();
  
  let verifiedArtistToken: string;
  let unverifiedArtistToken: string;
  let buyerToken: string;
  let buyer2Token: string;
  let adminToken: string;
  
  let verifiedArtistId: string;
  let secondArtistId: string;
  let adminId: string;
  
  let myArtworkId: string;
  let theirArtworkId: string;

  const adminUser = {
    name: `Admin Curator ${uniqueId}`,
    email: `admin_auction_${uniqueId}_${Math.random().toString(36).substring(2, 7)}@nakshi.test`,
    password: 'Password123!',
    role: 'ADMIN',
  };

  const verifiedArtistUser = {
    name: `Verified Artisan ${uniqueId}`,
    email: `verified_artist_${uniqueId}_${Math.random().toString(36).substring(2, 7)}@nakshi.test`,
    password: 'Password123!',
    role: 'ARTIST',
  };

  const unverifiedArtistUser = {
    name: `Unverified Artisan ${uniqueId}`,
    email: `unverified_artist_${uniqueId}_${Math.random().toString(36).substring(2, 7)}@nakshi.test`,
    password: 'Password123!',
    role: 'ARTIST',
  };

  const buyerUser = {
    name: `Auction Buyer ${uniqueId}`,
    email: `buyer_auction_${uniqueId}_${Math.random().toString(36).substring(2, 7)}@nakshi.test`,
    password: 'Password123!',
    role: 'BUYER',
  };

  const buyer2User = {
    name: `Auction Buyer Two ${uniqueId}`,
    email: `buyer2_auction_${uniqueId}_${Math.random().toString(36).substring(2, 7)}@nakshi.test`,
    password: 'Password123!',
    role: 'BUYER',
  };

  let activeAuctionId: string;

  beforeAll(async () => {
    // Start test server on dynamic open port
    await new Promise<void>((resolve) => {
      serverInstance = app.listen(0, () => {
        const address = serverInstance.address() as AddressInfo;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });

    // Register users
    const vReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verifiedArtistUser),
    });
    const vData = (await vReg.json()) as any;
    verifiedArtistToken = vData.token;
    verifiedArtistId = vData.user.id;

    // Verify the first artist manually via Prisma
    await prisma.user.update({
      where: { id: verifiedArtistId },
      data: { isVerified: true },
    });

    // Login again to get a fresh token with isVerified: true
    const vLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verifiedArtistUser.email, password: verifiedArtistUser.password }),
    });
    const vLoginData = (await vLogin.json()) as any;
    verifiedArtistToken = vLoginData.token;

    const uvReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(unverifiedArtistUser),
    });
    const uvData = (await uvReg.json()) as any;
    unverifiedArtistToken = uvData.token;
    secondArtistId = uvData.user.id;

    const bReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buyerUser),
    });
    const bData = await bReg.json() as any;
    buyerToken = bData.token;

    const b2Reg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buyer2User),
    });
    const b2Data = (await b2Reg.json()) as any;
    buyer2Token = b2Data.token;

    const buyer2Id = b2Data.user.id;
    const buyer1Id = bData.user?.id || (await prisma.user.findUnique({ where: { email: buyerUser.email } }))!.id;

    // Set up Admin user
    let admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: `admin_auction_${uniqueId}@nakshi.test`,
          name: 'Nakshi SuperAdmin',
          passwordHash: await bcrypt.hash('Password123!', 10),
          role: 'ADMIN',
          wallet: { create: { balance: 0.0 } },
        },
      });
    }

    adminToken = AuthService.generateToken({
      id: admin.id,
      email: admin.email,
      role: 'ADMIN',
      name: admin.name,
    });
    adminId = admin.id;

    // Add credits to both buyers for bidding
    await prisma.wallet.update({
      where: { userId: buyer1Id },
      data: { balance: 1000 }
    });
    await prisma.wallet.update({
      where: { userId: buyer2Id },
      data: { balance: 1000 }
    });

    // Seed some artworks
    const myArtwork = await prisma.artwork.create({
      data: {
        title: 'My Artwork For Auction',
        description: 'Test description',
        medium: 'Terracotta',
        price: 500,
        imageUrl: 'https://example.com/image.jpg',
        artistId: verifiedArtistId,
        availability: 'AVAILABLE',
        moderationStatus: 'APPROVED'
      }
    });
    myArtworkId = myArtwork.id;

    const theirArtwork = await prisma.artwork.create({
      data: {
        title: 'Their Artwork',
        description: 'Test description',
        medium: 'Terracotta',
        price: 500,
        imageUrl: 'https://example.com/image.jpg',
        artistId: secondArtistId,
        availability: 'AVAILABLE',
        moderationStatus: 'APPROVED'
      }
    });
    theirArtworkId = theirArtwork.id;

    // Create an active auction for theirArtwork to test bidding
    const activeAuction = await prisma.auction.create({
      data: {
        artworkId: theirArtworkId,
        startingBid: 200,
        minIncrement: 20,
        startTime: new Date(Date.now() - 10000), // Started 10s ago
        endTime: new Date(Date.now() + 86400000),
        status: 'ACTIVE'
      }
    });
    activeAuctionId = activeAuction.id;
  });

  afterAll(async () => {
    serverInstance.close();
  });

  describe('POST /api/auctions', () => {
    it('rejects unauthenticated users', async () => {
      const res = await fetch(`${baseUrl}/api/auctions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artworkId: myArtworkId,
          startingBid: 100,
          minIncrement: 10,
          startTime: new Date(Date.now() + 10000).toISOString(),
          endTime: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
      expect(res.status).toBe(401);
    });

    it('rejects non-admin users (BUYER)', async () => {
      const res = await fetch(`${baseUrl}/api/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({
          artworkId: myArtworkId,
          startingBid: 100,
          minIncrement: 10,
          startTime: new Date(Date.now() + 10000).toISOString(),
          endTime: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
      expect(res.status).toBe(403);
    });

    it('rejects artist users (ARTIST role)', async () => {
      const res = await fetch(`${baseUrl}/api/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${verifiedArtistToken}`,
        },
        body: JSON.stringify({
          artworkId: myArtworkId,
          startingBid: 100,
          minIncrement: 10,
          startTime: new Date(Date.now() + 10000).toISOString(),
          endTime: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
      expect(res.status).toBe(403);
    });

    it('rejects invalid inputs (negative bid)', async () => {
      const res = await fetch(`${baseUrl}/api/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          artworkId: myArtworkId,
          startingBid: -100,
          minIncrement: 10,
          startTime: new Date(Date.now() + 10000).toISOString(),
          endTime: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
      expect(res.status).toBe(400);
    });

    it('rejects if start time is after end time', async () => {
      const res = await fetch(`${baseUrl}/api/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          artworkId: myArtworkId,
          startingBid: 100,
          minIncrement: 10,
          startTime: new Date(Date.now() + 86400000).toISOString(),
          endTime: new Date(Date.now() + 10000).toISOString(),
        }),
      });
      expect(res.status).toBe(400);
    });

    it('allows ADMIN to create an auction for an approved artwork', async () => {
      const startTime = new Date(Date.now() + 10000).toISOString();
      const endTime = new Date(Date.now() + 86400000).toISOString();
      const res = await fetch(`${baseUrl}/api/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          artworkId: myArtworkId,
          startingBid: 100,
          minIncrement: 10,
          startTime,
          endTime,
        }),
      });
      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.auction.artworkId).toBe(myArtworkId);
      expect(data.auction.status).toBe('UPCOMING');
      
      // Verify artwork is now reserved
      const artwork = await prisma.artwork.findUnique({ where: { id: myArtworkId } });
      expect(artwork?.availability).toBe('RESERVED');
    });

    it('rejects creating another auction for an artwork that already has one', async () => {
      const startTime = new Date(Date.now() + 20000).toISOString();
      const endTime = new Date(Date.now() + 90000000).toISOString();
      const res = await fetch(`${baseUrl}/api/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          artworkId: myArtworkId, // Already auctioned above
          startingBid: 100,
          minIncrement: 10,
          startTime,
          endTime,
        }),
      });
      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.error).toContain('Artwork is not available for auction');
    });
  });

  describe('GET /api/auctions (Public Browse)', () => {
    it('returns all auctions to public unauthenticated requests', async () => {
      const res = await fetch(`${baseUrl}/api/auctions`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.auctions).toBeInstanceOf(Array);
      expect(data.auctions.length).toBeGreaterThanOrEqual(1);
    });

    it('filters auctions by status parameter', async () => {
      const res = await fetch(`${baseUrl}/api/auctions?status=ACTIVE`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.auctions).toBeInstanceOf(Array);
      for (const a of data.auctions) {
        expect(a.status).toBe('ACTIVE');
      }
    });
  });

  describe('GET /api/auctions/my', () => {
    it('returns the artist\'s auctions', async () => {
      const res = await fetch(`${baseUrl}/api/auctions/my`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${verifiedArtistToken}`,
        },
      });
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.auctions).toBeInstanceOf(Array);
      expect(data.auctions.length).toBe(1);
      expect(data.auctions[0].artworkId).toBe(myArtworkId);
    });
  });

  describe('POST /api/auctions/:id/bid', () => {
    it('rejects unauthenticated users', async () => {
      const res = await fetch(`${baseUrl}/api/auctions/${activeAuctionId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 250 }),
      });
      expect(res.status).toBe(401);
    });

    it('rejects bidding on own artwork', async () => {
      const res = await fetch(`${baseUrl}/api/auctions/${activeAuctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unverifiedArtistToken}`, // The owner of theirArtworkId
        },
        body: JSON.stringify({ amount: 250 }),
      });
      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.error).toContain('cannot bid on your own');
    });

    it('rejects bid below starting bid', async () => {
      const res = await fetch(`${baseUrl}/api/auctions/${activeAuctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ amount: 150 }), // Starting bid is 200
      });
      expect(res.status).toBe(400);
    });

    it('allows a valid first bid', async () => {
      const res = await fetch(`${baseUrl}/api/auctions/${activeAuctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ amount: 250 }),
      });
      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(Number(data.bid.amount)).toBe(250);
      expect(data.bid.auctionId).toBe(activeAuctionId);
      expect(data.currentHighestBid).toBe(250);
      
      // Verify auction highest bid is updated
      const auction = await prisma.auction.findUnique({ where: { id: activeAuctionId } });
      expect(Number(auction?.currentHighestBid)).toBe(250);
      
      // Verify buyer1's wallet was deducted
      const fetchedBuyer1 = await prisma.user.findUnique({ where: { email: buyerUser.email }, include: { wallet: true } });
      expect(Number(fetchedBuyer1?.wallet?.balance)).toBe(750); // 1000 - 250
    });

    it('rejects a second bid that does not meet the minimum increment', async () => {
      const res = await fetch(`${baseUrl}/api/auctions/${activeAuctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyer2Token}`,
        },
        body: JSON.stringify({ amount: 260 }), // minIncrement is 20, highest is 250, so needs 270
      });
      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.error).toContain('current highest + increment');
    });

    it('allows outbidding and refunds the previous bidder', async () => {
      const res = await fetch(`${baseUrl}/api/auctions/${activeAuctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyer2Token}`,
        },
        body: JSON.stringify({ amount: 300 }),
      });
      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.currentHighestBid).toBe(300);
      
      // Verify buyer2's wallet was deducted
      const fetchedBuyer2 = await prisma.user.findUnique({ where: { email: buyer2User.email }, include: { wallet: true } });
      expect(Number(fetchedBuyer2?.wallet?.balance)).toBe(700); // 1000 - 300
      
      // Verify buyer1's wallet was refunded the 250
      const fetchedBuyer1Refunded = await prisma.user.findUnique({ where: { email: buyerUser.email }, include: { wallet: true } });
      expect(Number(fetchedBuyer1Refunded?.wallet?.balance)).toBe(1000); // 750 + 250
    });
  });
});
