import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { server as httpServer } from '../../src/server';
import { prisma } from '../../src/config/prisma';

describe('Real-Time Auction Socket State Broadcast Acceptance Tests (T-054)', () => {
  let serverInstance: http.Server;
  let baseUrl: string;
  const uniqueId = Date.now();

  let artistToken: string;
  let buyerToken: string;
  let artistId: string;

  let activeArtworkId: string;
  let activeAuctionId: string;

  const artistUser = {
    name: `Socket Artisan ${uniqueId}`,
    email: `socket_artist_${uniqueId}_${Math.random().toString(36).substring(2, 7)}@nakshi.test`,
    password: 'Password123!',
    role: 'ARTIST',
  };

  const buyerUser = {
    name: `Socket Viewer ${uniqueId}`,
    email: `socket_buyer_${uniqueId}_${Math.random().toString(36).substring(2, 7)}@nakshi.test`,
    password: 'Password123!',
    role: 'BUYER',
  };

  beforeAll(async () => {
    // Start server on dynamic port
    await new Promise<void>((resolve) => {
      serverInstance = httpServer.listen(0, () => {
        const address = serverInstance.address() as AddressInfo;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });

    // Register artist and buyer
    const aReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(artistUser),
    });
    const aData = (await aReg.json()) as any;
    artistToken = aData.token;
    artistId = aData.user.id;

    await prisma.user.update({
      where: { id: artistId },
      data: { isVerified: true },
    });

    const bReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buyerUser),
    });
    buyerToken = ((await bReg.json()) as any).token;

    // Seed artwork and active auction
    const artwork = await prisma.artwork.create({
      data: {
        title: 'Jamdani Saree for Socket Test',
        description: 'Heritage handwoven Jamdani artwork for live broadcast test.',
        medium: 'Handloom Jamdani',
        price: 800,
        imageUrl: 'https://example.com/socket-test.jpg',
        artistId: artistId,
        availability: 'RESERVED',
        moderationStatus: 'APPROVED',
      },
    });
    activeArtworkId = artwork.id;

    const now = Date.now();
    const auction = await prisma.auction.create({
      data: {
        artworkId: activeArtworkId,
        startingBid: 200,
        minIncrement: 20,
        startTime: new Date(now - 60000), // started 1 min ago
        endTime: new Date(now + 86400000), // ends in 24 hrs
        status: 'ACTIVE',
      },
    });
    activeAuctionId = auction.id;
  }, 30000);

  afterAll(async () => {
    serverInstance.close();
  });

  it('broadcasts updated auction state to connected room viewers when a new high bid is submitted', async () => {
    // 1. Connect Socket.IO client
    const clientSocket: ClientSocket = ioClient(baseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: false,
    });

    await new Promise<void>((resolve, reject) => {
      clientSocket.on('connect', resolve);
      clientSocket.on('connect_error', reject);
    });

    // 2. Client joins the auction room
    clientSocket.emit('join_auction', activeAuctionId);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 3. Set up listener for real-time broadcast payload
    const broadcastPromise = new Promise<any>((resolve) => {
      clientSocket.on('auction:updated', (data) => {
        resolve(data);
      });
    });

    // 4. Submit a valid higher bid via HTTP POST
    const res = await fetch(`${baseUrl}/api/auctions/${activeAuctionId}/bids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ amount: 220 }),
    });

    expect(res.status).toBe(201);

    // 5. Wait for socket broadcast event
    const broadcastData = await Promise.race([
      broadcastPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Socket broadcast timeout')), 5000)
      ),
    ]);

    // 6. Assert broadcast payload contents
    expect(broadcastData).toBeDefined();
    expect(broadcastData.auctionId).toBe(activeAuctionId);
    expect(broadcastData.currentHighestBid).toBe(220);
    expect(broadcastData.highestBidder).toBeDefined();
    expect(broadcastData.highestBidder.name).toBe(buyerUser.name);
    expect(broadcastData.bidId).toBeDefined();
    expect(broadcastData.timestamp).toBeDefined();

    clientSocket.disconnect();
  });
});
