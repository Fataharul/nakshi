import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../../src/server';
import { prisma } from '../../src/config/prisma';

describe('VIP Access Window Lifecycle Acceptance Tests (Before, During, and After Window)', () => {
  let serverInstance: http.Server;
  let baseUrl: string;
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  let organizerToken: string;
  let organizerId: string;
  let standardBuyerToken: string;
  let standardBuyerId: string;
  let vipBuyerToken: string;
  let vipBuyerId: string;

  let exhibitionBeforeVipId: string;
  let exhibitionDuringVipId: string;
  let exhibitionAfterVipId: string;
  let exhibitionPreOpeningId: string;

  let standardTicketBeforeVip: string;
  let standardTicketDuringVip: string;
  let vipTicketDuringVip: string;
  let standardTicketAfterVip: string;

  const organizerUser = {
    name: `Curator VIP ${uniqueId}`,
    email: `curator_vip_${uniqueId}@nakshi.test`,
    password: 'Password123!',
    role: 'ORGANIZER',
  };

  const standardBuyerUser = {
    name: `Standard Buyer ${uniqueId}`,
    email: `std_buyer_${uniqueId}@nakshi.test`,
    password: 'Password123!',
    role: 'BUYER',
  };

  const vipBuyerUser = {
    name: `VIP Collector ${uniqueId}`,
    email: `vip_buyer_${uniqueId}@nakshi.test`,
    password: 'Password123!',
    role: 'BUYER',
  };

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      serverInstance = app.listen(0, () => {
        const address = serverInstance.address() as AddressInfo;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });

    // 1. Register Organizer
    const orgReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(organizerUser),
    });
    const orgData = (await orgReg.json()) as any;
    expect(orgReg.status).toBe(201);
    organizerToken = orgData.token;
    organizerId = orgData.user.id;

    // 2. Register Buyers
    const stdReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(standardBuyerUser),
    });
    const stdData = (await stdReg.json()) as any;
    expect(stdReg.status).toBe(201);
    standardBuyerToken = stdData.token;
    standardBuyerId = stdData.user.id;

    const vipReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vipBuyerUser),
    });
    const vipData = (await vipReg.json()) as any;
    expect(vipReg.status).toBe(201);
    vipBuyerToken = vipData.token;
    vipBuyerId = vipData.user.id;

    // Credit buyers' wallets
    await prisma.wallet.updateMany({
      where: { userId: { in: [standardBuyerId, vipBuyerId] } },
      data: { balance: 3000 },
    });

    // 3. Create Organizer Artwork
    const orgArtwork = await prisma.artwork.create({
      data: {
        title: `Royal Muslin Weave ${uniqueId}`,
        description: 'Fine muslin heritage weave',
        price: 500,
        imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c',
        medium: 'Nakshi Kantha',
        artistId: organizerId,
        availability: 'AVAILABLE',
      },
    });

    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // 4. Create Exhibition BEFORE VIP Window (Open now, VIP window starts in 2 days)
    const exhBefore = await prisma.exhibition.create({
      data: {
        title: `Exhibition Before VIP ${uniqueId}`,
        description: 'Open now; VIP window begins in 2 days',
        ticketPrice: 50,
        startTime: new Date(now.getTime() - oneDayMs),
        endTime: new Date(now.getTime() + 10 * oneDayMs),
        vipStartTime: new Date(now.getTime() + 2 * oneDayMs),
        vipEndTime: new Date(now.getTime() + 4 * oneDayMs),
        organizerId,
      },
    });
    exhibitionBeforeVipId = exhBefore.id;

    // 5. Create Exhibition DURING VIP Window (Open now, VIP window active: started 2h ago, ends in 2h)
    const exhDuring = await prisma.exhibition.create({
      data: {
        title: `Exhibition During VIP ${uniqueId}`,
        description: 'VIP Preview Active Now',
        ticketPrice: 70,
        startTime: new Date(now.getTime() - oneDayMs),
        endTime: new Date(now.getTime() + 10 * oneDayMs),
        vipStartTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        vipEndTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        organizerId,
      },
    });
    exhibitionDuringVipId = exhDuring.id;

    // 6. Create Exhibition AFTER VIP Window (Open now, VIP window lapsed: ran from 4 days ago to yesterday)
    const exhAfter = await prisma.exhibition.create({
      data: {
        title: `Exhibition After VIP ${uniqueId}`,
        description: 'VIP Preview Concluded; General Admission Active',
        ticketPrice: 60,
        startTime: new Date(now.getTime() - 5 * oneDayMs),
        endTime: new Date(now.getTime() + 5 * oneDayMs),
        vipStartTime: new Date(now.getTime() - 4 * oneDayMs),
        vipEndTime: new Date(now.getTime() - oneDayMs),
        organizerId,
      },
    });
    exhibitionAfterVipId = exhAfter.id;

    // 7. Create Pre-Opening Exhibition with future VIP window (Not opened yet)
    const exhPreOpening = await prisma.exhibition.create({
      data: {
        title: `Pre-Opening Exhibition ${uniqueId}`,
        description: 'Opens in 3 days; VIP window in 4 days',
        ticketPrice: 40,
        startTime: new Date(now.getTime() + 3 * oneDayMs),
        endTime: new Date(now.getTime() + 10 * oneDayMs),
        vipStartTime: new Date(now.getTime() + 4 * oneDayMs),
        vipEndTime: new Date(now.getTime() + 6 * oneDayMs),
        organizerId,
      },
    });
    exhibitionPreOpeningId = exhPreOpening.id;

    // Attach artworks to exhibitions
    for (const exhId of [exhibitionBeforeVipId, exhibitionDuringVipId, exhibitionAfterVipId, exhibitionPreOpeningId]) {
      await prisma.exhibitionArtwork.create({
        data: {
          exhibitionId: exhId,
          artworkId: orgArtwork.id,
          wallPosition: 1,
          posX: 25,
          posY: 25,
        },
      });
    }

    // 8. Purchase Tickets
    // Standard buyer purchases standard pass for Exhibition Before VIP
    const tBeforeRes = await fetch(`${baseUrl}/api/exhibitions/${exhibitionBeforeVipId}/ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${standardBuyerToken}`,
      },
      body: JSON.stringify({ isVip: false }),
    });
    const tBeforeData = (await tBeforeRes.json()) as any;
    expect(tBeforeRes.status).toBe(201);
    standardTicketBeforeVip = tBeforeData.ticket.ticketToken;

    // Standard buyer purchases standard pass for Exhibition During VIP
    const tDuringRes = await fetch(`${baseUrl}/api/exhibitions/${exhibitionDuringVipId}/ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${standardBuyerToken}`,
      },
      body: JSON.stringify({ isVip: false }),
    });
    const tDuringData = (await tDuringRes.json()) as any;
    expect(tDuringRes.status).toBe(201);
    standardTicketDuringVip = tDuringData.ticket.ticketToken;

    // VIP buyer purchases VIP pass for Exhibition During VIP
    const tVipRes = await fetch(`${baseUrl}/api/exhibitions/${exhibitionDuringVipId}/ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vipBuyerToken}`,
      },
      body: JSON.stringify({ isVip: true }),
    });
    const tVipData = (await tVipRes.json()) as any;
    expect(tVipRes.status).toBe(201);
    vipTicketDuringVip = tVipData.ticket.ticketToken;

    // Standard buyer purchases standard pass for Exhibition After VIP
    const tAfterRes = await fetch(`${baseUrl}/api/exhibitions/${exhibitionAfterVipId}/ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${standardBuyerToken}`,
      },
      body: JSON.stringify({ isVip: false }),
    });
    const tAfterData = (await tAfterRes.json()) as any;
    expect(tAfterRes.status).toBe(201);
    standardTicketAfterVip = tAfterData.ticket.ticketToken;
  }, 60000);

  afterAll(async () => {
    if (serverInstance) {
      await new Promise<void>((resolve) => serverInstance.close(() => resolve()));
    }
  });

  describe('1. BEFORE the Scheduled VIP Window (startTime <= now < vipStartTime)', () => {
    it('allows standard ticket holder to enter room when VIP window is scheduled in the future', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionBeforeVipId}/room`, {
        headers: { Authorization: `Bearer ${standardBuyerToken}` },
      });

      const data = (await res.json()) as any;
      expect(res.status).toBe(200);
      expect(data.exhibition.id).toBe(exhibitionBeforeVipId);
      expect(data.accessPass.isVip).toBe(false);
      expect(data.artworks.length).toBeGreaterThan(0);
    });

    it('allows ticket access via ticketToken query parameter before VIP window', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionBeforeVipId}/room?ticketToken=${standardTicketBeforeVip}`);

      const data = (await res.json()) as any;
      expect(res.status).toBe(200);
      expect(data.exhibition.id).toBe(exhibitionBeforeVipId);
      expect(data.accessPass.ticketToken).toBe(standardTicketBeforeVip);
    });

    it('rejects unticketed guest on paid exhibition before VIP window with 403', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionBeforeVipId}/room`);
      const data = (await res.json()) as any;
      expect(res.status).toBe(403);
      expect(data.error || data.message).toMatch(/Exhibition access pass required/i);
    });
  });

  describe('2. DURING the Scheduled VIP Window (vipStartTime <= now <= vipEndTime)', () => {
    it('strictly blocks standard ticket holder with 403 during active VIP window', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionDuringVipId}/room`, {
        headers: { Authorization: `Bearer ${standardBuyerToken}` },
      });

      const data = (await res.json()) as any;
      expect(res.status).toBe(403);
      expect(data.error || data.message).toMatch(/reserved for VIP Collectors Pass holders/i);
    });

    it('strictly blocks standard ticketToken query entry with 403 during active VIP window', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionDuringVipId}/room?ticketToken=${standardTicketDuringVip}`);

      const data = (await res.json()) as any;
      expect(res.status).toBe(403);
      expect(data.error || data.message).toMatch(/reserved for VIP Collectors Pass holders/i);
    });

    it('admits VIP ticket holder with 200 during active VIP window', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionDuringVipId}/room`, {
        headers: { Authorization: `Bearer ${vipBuyerToken}` },
      });

      const data = (await res.json()) as any;
      expect(res.status).toBe(200);
      expect(data.exhibition.id).toBe(exhibitionDuringVipId);
      expect(data.accessPass.isVip).toBe(true);
      expect(data.artworks.length).toBeGreaterThan(0);
    });

    it('admits VIP ticket via ticketToken query parameter during active VIP window', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionDuringVipId}/room?ticketToken=${vipTicketDuringVip}`);

      const data = (await res.json()) as any;
      expect(res.status).toBe(200);
      expect(data.exhibition.id).toBe(exhibitionDuringVipId);
      expect(data.accessPass.ticketToken).toBe(vipTicketDuringVip);
      expect(data.accessPass.isVip).toBe(true);
    });

    it('permits organizer curator preview during active VIP window with 200', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionDuringVipId}/room`, {
        headers: { Authorization: `Bearer ${organizerToken}` },
      });

      const data = (await res.json()) as any;
      expect(res.status).toBe(200);
      expect(data.exhibition.id).toBe(exhibitionDuringVipId);
    });

    it('allows standard ticket holder to upgrade to VIP pass and successfully enter during VIP window', async () => {
      // 1. Upgrade standard ticket to VIP
      const upgradeRes = await fetch(`${baseUrl}/api/exhibitions/${exhibitionDuringVipId}/ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${standardBuyerToken}`,
        },
        body: JSON.stringify({ isVip: true }),
      });

      const upgradeData = (await upgradeRes.json()) as any;
      expect([200, 201]).toContain(upgradeRes.status);
      expect(upgradeData.ticket.isVip).toBe(true);

      // 2. Room entry now succeeds with 200
      const roomRes = await fetch(`${baseUrl}/api/exhibitions/${exhibitionDuringVipId}/room`, {
        headers: { Authorization: `Bearer ${standardBuyerToken}` },
      });

      const roomData = (await roomRes.json()) as any;
      expect(roomRes.status).toBe(200);
      expect(roomData.accessPass.isVip).toBe(true);
    });
  });

  describe('3. AFTER the Scheduled VIP Window (vipEndTime < now < endTime)', () => {
    it('lifts VIP restriction and admits standard ticket holder with 200 after VIP window ends', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionAfterVipId}/room`, {
        headers: { Authorization: `Bearer ${standardBuyerToken}` },
      });

      const data = (await res.json()) as any;
      expect(res.status).toBe(200);
      expect(data.exhibition.id).toBe(exhibitionAfterVipId);
      expect(data.accessPass.isVip).toBe(false);
      expect(data.artworks.length).toBeGreaterThan(0);
    });

    it('admits standard ticket via ticketToken query parameter after VIP window ends', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionAfterVipId}/room?ticketToken=${standardTicketAfterVip}`);

      const data = (await res.json()) as any;
      expect(res.status).toBe(200);
      expect(data.exhibition.id).toBe(exhibitionAfterVipId);
      expect(data.accessPass.ticketToken).toBe(standardTicketAfterVip);
    });

    it('still rejects unticketed visitors after VIP window has ended on paid exhibition', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionAfterVipId}/room`);
      const data = (await res.json()) as any;
      expect(res.status).toBe(403);
      expect(data.error || data.message).toMatch(/Exhibition access pass required/i);
    });
  });

  describe('4. Pre-Opening Guard (now < startTime < vipStartTime)', () => {
    it('rejects visitor entry before exhibition schedule opens even with future VIP window', async () => {
      // Issue a ticket in DB for pre-opening exhibition
      await prisma.exhibitionTicket.create({
        data: {
          ticketToken: `NK-EXH-PRE-${Date.now()}`,
          exhibitionId: exhibitionPreOpeningId,
          buyerId: standardBuyerId,
          isVip: false,
        },
      });

      const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionPreOpeningId}/room`, {
        headers: { Authorization: `Bearer ${standardBuyerToken}` },
      });

      const data = (await res.json()) as any;
      expect(res.status).toBe(403);
      expect(data.error || data.message).toMatch(/has not opened yet/i);
    });
  });
});
