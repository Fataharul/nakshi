import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { ArtworkAvailability } from '@prisma/client';
import { app } from '../../src/server';
import { prisma } from '../../src/config/prisma';

/**
 * T-060: Test auction expiration and post-close bid rejection.
 * Acceptance criterion: no bid can be submitted after the auction has closed.
 */
describe('Auction Expiration & Post-Close Bid Rejection (T-060)', () => {
  let serverInstance: http.Server;
  let baseUrl: string;
  const uniqueId = Date.now();
  const rand = () => Math.random().toString(36).substring(2, 7);

  let artistId: string;
  let buyer1Token: string;
  let buyer2Token: string;
  let buyer1Id: string;
  let buyer2Id: string;

  const register = async (label: string, role: 'ARTIST' | 'BUYER') => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${label} ${uniqueId}`,
        email: `${label.toLowerCase().replace(/\s+/g, '_')}_${uniqueId}_${rand()}@nakshi.test`,
        password: 'Password123!',
        role,
      }),
    });
    const data = (await res.json()) as any;
    return { token: data.token as string, id: data.user.id as string };
  };

  const postBid = (token: string, auctionId: string, amount: number) =>
    fetch(`${baseUrl}/api/auctions/${auctionId}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount }),
    });

  const getBalance = async (userId: string) => {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    return Number(wallet!.balance);
  };

  const createReservedArtwork = (title: string) =>
    prisma.artwork.create({
      data: {
        title,
        description: 'Test description',
        medium: 'Terracotta',
        price: 500,
        imageUrl: 'https://example.com/image.jpg',
        artistId,
        availability: ArtworkAvailability.RESERVED,
        moderationStatus: 'APPROVED',
      },
    });

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      serverInstance = app.listen(0, () => {
        const address = serverInstance.address() as AddressInfo;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });

    const artist = await register('Expiry Artist', 'ARTIST');
    artistId = artist.id;

    const b1 = await register('Expiry Buyer One', 'BUYER');
    buyer1Token = b1.token;
    buyer1Id = b1.id;

    const b2 = await register('Expiry Buyer Two', 'BUYER');
    buyer2Token = b2.token;
    buyer2Id = b2.id;

    await prisma.wallet.update({ where: { userId: buyer1Id }, data: { balance: 1000 } });
    await prisma.wallet.update({ where: { userId: buyer2Id }, data: { balance: 1000 } });
  }, 60000);

  afterAll(async () => {
    serverInstance.close();
  });

  describe('auction with a winning bid', () => {
    let auctionId: string;
    let artworkId: string;

    beforeAll(async () => {
      const artwork = await createReservedArtwork('Expiry Artwork With Bid');
      artworkId = artwork.id;

      const auction = await prisma.auction.create({
        data: {
          artworkId,
          startingBid: 200,
          minIncrement: 20,
          startTime: new Date(Date.now() - 60000),
          endTime: new Date(Date.now() + 3600000), // still open for now
          status: 'ACTIVE',
        },
      });
      auctionId = auction.id;

      // Buyer 1 places a real bid through the API while the auction is open
      const bidRes = await postBid(buyer1Token, auctionId, 250);
      expect(bidRes.status).toBe(201);

      // Simulate the timer running out: endTime moves into the past,
      // but status is still ACTIVE because the background worker has not run yet.
      await prisma.auction.update({
        where: { id: auctionId },
        data: { endTime: new Date(Date.now() - 1000) },
      });
    }, 60000);

    it('rejects a bid after endTime even before the worker marks the auction CLOSED', async () => {
      const before = await prisma.auction.findUnique({ where: { id: auctionId } });
      expect(before?.status).toBe('ACTIVE'); // worker has not closed it yet

      const buyer2BalanceBefore = await getBalance(buyer2Id);

      const res = await postBid(buyer2Token, auctionId, 300);
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Auction has ended');

      const after = await prisma.auction.findUnique({ where: { id: auctionId } });
      expect(Number(after?.currentHighestBid)).toBe(250);
      expect(await prisma.auctionBid.count({ where: { auctionId } })).toBe(1);
      expect(await getBalance(buyer2Id)).toBe(buyer2BalanceBefore); // no credits held
    }, 30000);
    
    it('closes the expired auction, records the winner, marks the artwork SOLD and pays the artist', async () => {
      const artistBalanceBefore = await getBalance(artistId);

      // Listing auctions runs the same expiry sync that the background worker uses
      const listRes = await fetch(`${baseUrl}/api/auctions?status=ALL`);
      expect(listRes.status).toBe(200);

      const closed = await prisma.auction.findUnique({ where: { id: auctionId } });
      expect(closed?.status).toBe('CLOSED');
      expect(closed?.winnerId).toBe(buyer1Id);

      const artwork = await prisma.artwork.findUnique({ where: { id: artworkId } });
      expect(artwork?.availability).toBe('SOLD');

      expect(await getBalance(artistId)).toBe(250);
    }, 30000);
    
    it('rejects bids once the auction is CLOSED and leaves bids and wallets unchanged', async () => {
      const buyer1BalanceBefore = await getBalance(buyer1Id);
      const buyer2BalanceBefore = await getBalance(buyer2Id);

      for (const token of [buyer2Token, buyer1Token]) {
        const res = await postBid(token, auctionId, 500);
        expect(res.status).toBe(400);
        const data = (await res.json()) as any;
        expect(data.error).toContain('Current status: CLOSED');
      }

      const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
      expect(Number(auction?.currentHighestBid)).toBe(250);
      expect(auction?.winnerId).toBe(buyer1Id);
      expect(await prisma.auctionBid.count({ where: { auctionId } })).toBe(1);
      expect(await getBalance(buyer1Id)).toBe(buyer1BalanceBefore);
      expect(await getBalance(buyer2Id)).toBe(buyer2BalanceBefore);
    }, 30000);

    it('does not pay the artist again when a CLOSED auction is processed a second time', async () => {
      const artistBalanceBefore = await getBalance(artistId);

      const listRes = await fetch(`${baseUrl}/api/auctions?status=ALL`);
      expect(listRes.status).toBe(200);

      expect(await getBalance(artistId)).toBe(artistBalanceBefore);
    }, 30000);
  });
  describe('auction that expires without any bids', () => {
    let auctionId: string;
    let artworkId: string;

    beforeAll(async () => {
      const artwork = await createReservedArtwork('Expiry Artwork Without Bid');
      artworkId = artwork.id;

      const auction = await prisma.auction.create({
        data: {
          artworkId,
          startingBid: 200,
          minIncrement: 20,
          startTime: new Date(Date.now() - 60000),
          endTime: new Date(Date.now() - 1000), // already expired, status still ACTIVE
          status: 'ACTIVE',
        },
      });
      auctionId = auction.id;
    }, 60000);

    it('closes with no winner and returns the artwork to AVAILABLE', async () => {
      const listRes = await fetch(`${baseUrl}/api/auctions?status=ALL`);
      expect(listRes.status).toBe(200);

      const closed = await prisma.auction.findUnique({ where: { id: auctionId } });
      expect(closed?.status).toBe('CLOSED');
      expect(closed?.winnerId).toBeNull();

      const artwork = await prisma.artwork.findUnique({ where: { id: artworkId } });
      expect(artwork?.availability).toBe('AVAILABLE');
    }, 30000);

    it('rejects a bid after it has closed', async () => {
      const res = await postBid(buyer1Token, auctionId, 250);
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Current status: CLOSED');
      expect(await prisma.auctionBid.count({ where: { auctionId } })).toBe(0);
    }, 30000);
  });
});
  

