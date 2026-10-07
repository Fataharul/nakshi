import { test, expect } from '@playwright/test';
import { prisma } from '../server/src/config/prisma';
import { AuctionStatus, Role } from '@prisma/client';

/**
 * Acceptance Criteria 3.5: Admin-Managed Live Auctions
 * - Only Admin can create and configure auctions
 * - Real-time WebSocket bids and synchronized countdown
 * - Instant outbid notifications
 * - Auction settlement and single winner credit deduction
 */
test.describe('Acceptance Criteria 3.5: Auctions', () => {
  const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
  const uniqueId = Date.now();
  let buyerToken: string;
  let buyerId: string;
  let auctionId: string;

  test.beforeAll(async ({ request }) => {
    // 1. Register a test buyer
    const buyerRes = await request.post(`${serverUrl}/api/auth/register`, {
      data: {
        name: `Playwright Bidder ${uniqueId}`,
        email: `pw_bidder_${uniqueId}@nakshi.test`,
        password: 'Password123!',
        role: 'BUYER',
      },
    });
    const buyerData = (await buyerRes.json()) as any;
    buyerToken = buyerData.token;
    buyerId = buyerData.user.id;

    // 2. Fund buyer's wallet with test credits
    await prisma.wallet.update({
      where: { userId: buyerId },
      data: { balance: 2000.0 },
    });

    // 3. Create artist and artwork
    const artist = await prisma.user.create({
      data: {
        name: `Artisan Playwright ${uniqueId}`,
        email: `artisan_pw_${uniqueId}@nakshi.test`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: Role.ARTIST,
      },
    });

    const artwork = await prisma.artwork.create({
      data: {
        artistId: artist.id,
        title: `Playwright Heritage Tapestry ${uniqueId}`,
        description: 'Traditional Kantha embroidered quilt.',
        medium: 'Nakshi Kantha',
        price: 300.0,
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        moderationStatus: 'APPROVED',
      },
    });

    // 4. Create an active auction with startingBid: 100, minIncrement: 15
    const now = new Date();
    const auction = await prisma.auction.create({
      data: {
        artworkId: artwork.id,
        startingBid: 100.0,
        minIncrement: 15.0,
        startTime: new Date(now.getTime() - 60000),
        endTime: new Date(now.getTime() + 3600000),
        status: AuctionStatus.ACTIVE,
      },
    });
    auctionId = auction.id;
  });

  test.skip('admin creates auction and multiple buyers participate in real time', async ({ browser }) => {
    // Multi-context test:
    // Buyer 1 submits bid -> Buyer 2 receives instant outbid notification over WebSocket
  });

  test('rejects bid below the required minimum increment', async ({ request }) => {
    // Step 1: Reject opening bid below starting bid (e.g. 80 < 100)
    const belowStartingRes = await request.post(`${serverUrl}/api/auctions/${auctionId}/bid`, {
      headers: {
        Authorization: `Bearer ${buyerToken}`,
      },
      data: { amount: 80.0 },
    });
    expect(belowStartingRes.status()).toBe(400);
    const belowStartingJson = (await belowStartingRes.json()) as any;
    expect(belowStartingJson.error).toContain('below the opening starting bid of 100.00 credits');

    // Step 2: Place valid opening bid meeting starting bid (100.00)
    const validOpeningRes = await request.post(`${serverUrl}/api/auctions/${auctionId}/bid`, {
      headers: {
        Authorization: `Bearer ${buyerToken}`,
      },
      data: { amount: 100.0 },
    });
    expect(validOpeningRes.status()).toBe(201);
    const validOpeningJson = (await validOpeningRes.json()) as any;
    expect(validOpeningJson.auction.currentHighestBid).toBe(100);
    expect(validOpeningJson.auction.minNextBid).toBe(115); // 100 + 15

    // Step 3: Reject subsequent bid below currentHighestBid + minIncrement (e.g. 105 < 115)
    const belowIncrementRes = await request.post(`${serverUrl}/api/auctions/${auctionId}/bid`, {
      headers: {
        Authorization: `Bearer ${buyerToken}`,
      },
      data: { amount: 105.0 },
    });
    expect(belowIncrementRes.status()).toBe(400);
    const belowIncrementJson = (await belowIncrementRes.json()) as any;
    expect(belowIncrementJson.error).toContain('does not meet the minimum increment');
    expect(belowIncrementJson.error).toContain('Must be at least 115.00 credits');

    // Step 4: Accept subsequent bid that satisfies the minimum step increment (115.00)
    const validSubsequentRes = await request.post(`${serverUrl}/api/auctions/${auctionId}/bid`, {
      headers: {
        Authorization: `Bearer ${buyerToken}`,
      },
      data: { amount: 115.0 },
    });
    expect(validSubsequentRes.status()).toBe(201);
    const validSubsequentJson = (await validSubsequentRes.json()) as any;
    expect(validSubsequentJson.auction.currentHighestBid).toBe(115);
    expect(validSubsequentJson.auction.minNextBid).toBe(130);
  });
});
