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
});
