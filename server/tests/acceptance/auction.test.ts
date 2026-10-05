import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../../src/server';
import { prisma } from '../../src/config/prisma';

describe('Auction Creation & Seller Management Acceptance Tests', () => {
  let serverInstance: http.Server;
  let baseUrl: string;
  const uniqueId = Date.now();
  
  let verifiedArtistToken: string;
  let unverifiedArtistToken: string;
  let buyerToken: string;
  let secondBuyerToken: string;
  
  let verifiedArtistId: string;
  let secondArtistId: string;
  
  let myArtworkId: string;
  let theirArtworkId: string;

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

  const secondBuyerUser = {
    name: `Second Auction Buyer ${uniqueId}`,
    email: `second_buyer_auction_${uniqueId}_${Math.random().toString(36).substring(2, 7)}@nakshi.test`,
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
    buyerToken = ((await bReg.json()) as any).token;

    const sbReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(secondBuyerUser),
    });
    secondBuyerToken = ((await sbReg.json()) as any).token;

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
  }, 30000);


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

    it('rejects non-artist users (BUYER)', async () => {
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

    it('rejects unverified artists', async () => {
      const res = await fetch(`${baseUrl}/api/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unverifiedArtistToken}`,
        },
        body: JSON.stringify({
          artworkId: theirArtworkId,
          startingBid: 100,
          minIncrement: 10,
          startTime: new Date(Date.now() + 10000).toISOString(),
          endTime: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
      expect(res.status).toBe(403);
      const data = await res.json() as any;
      expect(data.error).toContain('Only verified artists');
    });

    it('rejects invalid inputs (negative bid)', async () => {
      const res = await fetch(`${baseUrl}/api/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${verifiedArtistToken}`,
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
          Authorization: `Bearer ${verifiedArtistToken}`,
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

    it('rejects if artist tries to auction someone else\'s artwork', async () => {
      const res = await fetch(`${baseUrl}/api/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${verifiedArtistToken}`,
        },
        body: JSON.stringify({
          artworkId: theirArtworkId,
          startingBid: 100,
          minIncrement: 10,
          startTime: new Date(Date.now() + 10000).toISOString(),
          endTime: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
      expect(res.status).toBe(403);
    });

    it('allows verified artist to create an auction for their own artwork', async () => {
      const startTime = new Date(Date.now() + 10000).toISOString();
      const endTime = new Date(Date.now() + 86400000).toISOString();
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
          Authorization: `Bearer ${verifiedArtistToken}`,
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

  describe('POST /api/auctions/:id/bids Acceptance Tests (T-052)', () => {
    let activeAuctionId: string;
    let activeArtworkId: string;

    beforeAll(async () => {
      // Seed a dedicated artwork and active auction for bid submission tests
      const artwork = await prisma.artwork.create({
        data: {
          title: 'Artwork For Bidding Test',
          description: 'Authentic Nakshi Kantha tapestry for bid testing.',
          medium: 'Handloom Jamdani',
          price: 1000,
          imageUrl: 'https://example.com/bidding-test.jpg',
          artistId: verifiedArtistId,
          availability: 'RESERVED',
          moderationStatus: 'APPROVED',
        },
      });
      activeArtworkId = artwork.id;

      const now = Date.now();
      const auction = await prisma.auction.create({
        data: {
          artworkId: activeArtworkId,
          startingBid: 100,
          minIncrement: 10,
          startTime: new Date(now - 60000), // started 1 min ago
          endTime: new Date(now + 86400000), // ends in 24 hours
          status: 'ACTIVE',
        },
      });
      activeAuctionId = auction.id;
    });

    it('rejects unauthenticated bid submissions with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/auctions/${activeAuctionId}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 120 }),
      });
      expect(res.status).toBe(401);
    });

    it('rejects non-positive or invalid bid amounts (amount <= 0 or invalid format) with 400 Bad Request', async () => {
      const negativeRes = await fetch(`${baseUrl}/api/auctions/${activeAuctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ amount: -50 }),
      });
      expect(negativeRes.status).toBe(400);

      const zeroRes = await fetch(`${baseUrl}/api/auctions/${activeAuctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ amount: 0 }),
      });
      expect(zeroRes.status).toBe(400);

      const invalidFormatRes = await fetch(`${baseUrl}/api/auctions/${activeAuctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ amount: 'not-a-number' }),
      });
      expect(invalidFormatRes.status).toBe(400);
    });

    it('rejects bid submission below starting bid when no highest bid exists with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/auctions/${activeAuctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ amount: 80 }), // startingBid is 100
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toContain('starting bid');
    });

    it('accepts initial valid bid meeting starting bid when no highest bid exists', async () => {
      const res = await fetch(`${baseUrl}/api/auctions/${activeAuctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ amount: 100 }), // startingBid = 100
      });
      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.bid.amount).toBe(100);
      expect(data.auction.currentHighestBid).toBe(100);
    });

    it('rejects bid equal to or less than the current highest bid with 400 Bad Request', async () => {
      // currentHighest is now 100
      const equalRes = await fetch(`${baseUrl}/api/auctions/${activeAuctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secondBuyerToken}`,
        },
        body: JSON.stringify({ amount: 100 }),
      });
      expect(equalRes.status).toBe(400);
      const equalData = (await equalRes.json()) as any;
      expect(equalData.error).toContain('higher than the current highest bid');

      const lowerRes = await fetch(`${baseUrl}/api/auctions/${activeAuctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secondBuyerToken}`,
        },
        body: JSON.stringify({ amount: 90 }),
      });
      expect(lowerRes.status).toBe(400);
      const lowerData = (await lowerRes.json()) as any;
      expect(lowerData.error).toContain('higher than the current highest bid');
    });

    it('rejects bid that is higher than current highest but below required minimum step increment with 400 Bad Request', async () => {
      // currentHighest is 100, minIncrement is 10 -> required minimum is 110. Submitting 105.
      const res = await fetch(`${baseUrl}/api/auctions/${activeAuctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secondBuyerToken}`,
        },
        body: JSON.stringify({ amount: 105 }),
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toContain('minimum increment step');
    });

    it('accepts valid bid submission meeting current highest bid + minimum step increment', async () => {
      // currentHighest is 100, minIncrement is 10 -> 110 is valid
      const res = await fetch(`${baseUrl}/api/auctions/${activeAuctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secondBuyerToken}`,
        },
        body: JSON.stringify({ amount: 110 }),
      });
      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.bid.amount).toBe(110);
      expect(data.auction.currentHighestBid).toBe(110);
    });

    it('rejects seller attempting to bid on their own auction with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/auctions/${activeAuctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${verifiedArtistToken}`,
        },
        body: JSON.stringify({ amount: 150 }),
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toContain('own auctions');
    });

    it('rejects bid submission when the auction timer has expired with 400 Bad Request (T-058)', async () => {
      // Seed an expired auction (endTime in past)
      const expiredArtwork = await prisma.artwork.create({
        data: {
          title: 'Expired Auction Artwork',
          description: 'Artwork for expired timer test.',
          medium: 'Brass Metalwork',
          price: 500,
          imageUrl: 'https://example.com/expired.jpg',
          artistId: verifiedArtistId,
          availability: 'RESERVED',
          moderationStatus: 'APPROVED',
        },
      });

      const now = Date.now();
      const expiredAuction = await prisma.auction.create({
        data: {
          artworkId: expiredArtwork.id,
          startingBid: 100,
          minIncrement: 10,
          startTime: new Date(now - 7200000), // 2 hours ago
          endTime: new Date(now - 3600000), // 1 hour ago
          status: 'ACTIVE',
        },
      });

      const res = await fetch(`${baseUrl}/api/auctions/${expiredAuction.id}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ amount: 150 }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toContain('bidding is locked');

      // Verify auction status was updated to ENDED in database
      const dbAuction = await prisma.auction.findUnique({ where: { id: expiredAuction.id } });
      expect(dbAuction?.status).toBe('ENDED');
    });

    it('rejects bid submission when auction status is explicitly ENDED with 400 Bad Request (T-058)', async () => {
      const endedArtwork = await prisma.artwork.create({
        data: {
          title: 'Explicitly Ended Auction Artwork',
          description: 'Artwork for ended status test.',
          medium: 'Wood Carving',
          price: 600,
          imageUrl: 'https://example.com/ended.jpg',
          artistId: verifiedArtistId,
          availability: 'RESERVED',
          moderationStatus: 'APPROVED',
        },
      });

      const endedAuction = await prisma.auction.create({
        data: {
          artworkId: endedArtwork.id,
          startingBid: 150,
          minIncrement: 15,
          startTime: new Date(Date.now() - 7200000),
          endTime: new Date(Date.now() - 3600000),
          status: 'ENDED',
        },
      });

      const res = await fetch(`${baseUrl}/api/auctions/${endedAuction.id}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ amount: 200 }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toContain('bidding is locked');
    });
  });
});


