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
  });
});