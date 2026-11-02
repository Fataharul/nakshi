import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../../src/server';
import { prisma } from '../../src/config/prisma';

describe('Exhibition Ticket Token Validation & Entry Hardening Acceptance Tests', () => {
  let serverInstance: http.Server;
  let baseUrl: string;
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  let organizerToken: string;
  let organizerId: string;
  let buyerToken: string;
  let buyerId: string;
  let otherBuyerToken: string;
  let otherBuyerId: string;

  let activeExhibitionId: string;
  let secondExhibitionId: string;
  let upcomingExhibitionId: string;
  let concludedExhibitionId: string;
  let vipExhibitionId: string;

  let standardTicketToken: string;
  let secondExhTicketToken: string;
  let vipTicketToken: string;
  let standardTicketForVipExhToken: string;

  const organizerUser = {
    name: `Curator ${uniqueId}`,
    email: `curator_${uniqueId}@nakshi.test`,
    password: 'Password123!',
    role: 'ORGANIZER',
  };

  const buyerUser = {
    name: `Collector ${uniqueId}`,
    email: `buyer_${uniqueId}@nakshi.test`,
    password: 'Password123!',
    role: 'BUYER',
  };

  const otherBuyerUser = {
    name: `Other Buyer ${uniqueId}`,
    email: `other_buyer_${uniqueId}@nakshi.test`,
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
    const buyerReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buyerUser),
    });
    const buyerData = (await buyerReg.json()) as any;
    expect(buyerReg.status).toBe(201);
    buyerToken = buyerData.token;
    buyerId = buyerData.user.id;

    const otherBuyerReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(otherBuyerUser),
    });
    const otherBuyerData = (await otherBuyerReg.json()) as any;
    expect(otherBuyerReg.status).toBe(201);
    otherBuyerToken = otherBuyerData.token;
    otherBuyerId = otherBuyerData.user.id;

    // Credit buyer wallets
    await prisma.wallet.updateMany({
      where: { userId: { in: [buyerId, otherBuyerId] } },
      data: { balance: 2000 },
    });

    // 3. Create Artworks for Organizer
    const orgArtwork = await prisma.artwork.create({
      data: {
        title: `Curated Tapestry ${uniqueId}`,
        description: 'Handwoven Bengal silk and cotton tapestry.',
        medium: 'Silk & Cotton',
        price: 500,
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800',
        artistId: organizerId,
      },
    });

    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // 4. Create Active Exhibition A
    const exhA = await prisma.exhibition.create({
      data: {
        title: `Active Pavilion A ${uniqueId}`,
        description: 'Bengal Tapestry Showcase A',
        ticketPrice: 50,
        startTime: new Date(now.getTime() - oneDayMs),
        endTime: new Date(now.getTime() + 7 * oneDayMs),
        organizerId,
        artworks: {
          create: {
            artworkId: orgArtwork.id,
            wallPosition: 1,
            posX: 20,
            posY: 20,
          },
        },
      },
    });
    activeExhibitionId = exhA.id;

    // 5. Create Active Exhibition B (for cross-token tests)
    const exhB = await prisma.exhibition.create({
      data: {
        title: `Active Pavilion B ${uniqueId}`,
        description: 'Bengal Tapestry Showcase B',
        ticketPrice: 50,
        startTime: new Date(now.getTime() - oneDayMs),
        endTime: new Date(now.getTime() + 7 * oneDayMs),
        organizerId,
      },
    });
    secondExhibitionId = exhB.id;

    // 6. Create Upcoming Exhibition (starts in 3 days)
    const exhUpcoming = await prisma.exhibition.create({
      data: {
        title: `Upcoming Pavilion ${uniqueId}`,
        description: 'Future Showcase',
        ticketPrice: 60,
        startTime: new Date(now.getTime() + 3 * oneDayMs),
        endTime: new Date(now.getTime() + 10 * oneDayMs),
        organizerId,
      },
    });
    upcomingExhibitionId = exhUpcoming.id;

    // 7. Create Concluded Exhibition (ended yesterday)
    const exhConcluded = await prisma.exhibition.create({
      data: {
        title: `Concluded Pavilion ${uniqueId}`,
        description: 'Past Showcase',
        ticketPrice: 40,
        startTime: new Date(now.getTime() - 10 * oneDayMs),
        endTime: new Date(now.getTime() - oneDayMs),
        organizerId,
      },
    });
    concludedExhibitionId = exhConcluded.id;

    // 8. Create Exhibition with Active VIP Window
    const exhVip = await prisma.exhibition.create({
      data: {
        title: `VIP Preview Pavilion ${uniqueId}`,
        description: 'Exclusive VIP Window Active',
        ticketPrice: 80,
        startTime: new Date(now.getTime() - oneDayMs),
        endTime: new Date(now.getTime() + 5 * oneDayMs),
        vipStartTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // started 2 hours ago
        vipEndTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // ends in 2 hours
        organizerId,
      },
    });
    vipExhibitionId = exhVip.id;

    // 9. Purchase tickets
    // Buyer purchases Standard ticket for Exhibition A
    const ticketARes = await fetch(`${baseUrl}/api/exhibitions/${activeExhibitionId}/ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ isVip: false }),
    });
    const ticketAData = (await ticketARes.json()) as any;
    expect(ticketARes.status).toBe(201);
    standardTicketToken = ticketAData.ticket.ticketToken;

    // Other Buyer purchases Standard ticket for Exhibition B
    const ticketBRes = await fetch(`${baseUrl}/api/exhibitions/${secondExhibitionId}/ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherBuyerToken}`,
      },
      body: JSON.stringify({ isVip: false }),
    });
    const ticketBData = (await ticketBRes.json()) as any;
    expect(ticketBRes.status).toBe(201);
    secondExhTicketToken = ticketBData.ticket.ticketToken;

    // Buyer purchases VIP ticket for VIP Exhibition
    const ticketVipRes = await fetch(`${baseUrl}/api/exhibitions/${vipExhibitionId}/ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ isVip: true }),
    });
    const ticketVipData = (await ticketVipRes.json()) as any;
    expect(ticketVipRes.status).toBe(201);
    vipTicketToken = ticketVipData.ticket.ticketToken;

    // Other Buyer purchases Standard ticket for VIP Exhibition
    const ticketStandardVipRes = await fetch(`${baseUrl}/api/exhibitions/${vipExhibitionId}/ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherBuyerToken}`,
      },
      body: JSON.stringify({ isVip: false }),
    });
    const ticketStandardVipData = (await ticketStandardVipRes.json()) as any;
    expect(ticketStandardVipRes.status).toBe(201);
    standardTicketForVipExhToken = ticketStandardVipData.ticket.ticketToken;
  });

  afterAll(async () => {
    try {
      const exhibitionIds = [
        activeExhibitionId,
        secondExhibitionId,
        upcomingExhibitionId,
        concludedExhibitionId,
        vipExhibitionId,
      ].filter(Boolean);

      await prisma.exhibitionTicket.deleteMany({
        where: { exhibitionId: { in: exhibitionIds } },
      });
      await prisma.exhibitionArtwork.deleteMany({
        where: { exhibitionId: { in: exhibitionIds } },
      });
      await prisma.creditTransaction.deleteMany({
        where: { referenceId: { in: exhibitionIds } },
      });
      await prisma.exhibition.deleteMany({
        where: { id: { in: exhibitionIds } },
      });
      await prisma.artwork.deleteMany({
        where: { artistId: organizerId },
      });
      await prisma.wallet.deleteMany({
        where: { userId: { in: [organizerId, buyerId, otherBuyerId].filter(Boolean) } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [organizerId, buyerId, otherBuyerId].filter(Boolean) } },
      });
    } catch (err) {
      console.error('Error cleaning up exhibition ticket tests:', err);
    }

    if (serverInstance) {
      serverInstance.close();
    }
  });

  it('validates a valid exhibition ticket token successfully', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions/${activeExhibitionId}/validate-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketToken: standardTicketToken }),
    });

    const data = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.accessGranted).toBe(true);
    expect(data.ticket.ticketToken).toBe(standardTicketToken);
    expect(data.ticket.isVip).toBe(false);
    expect(data.ticket.buyer.name).toBe(buyerUser.name);
    expect(data.exhibition.id).toBe(activeExhibitionId);
  });

  it('rejects validation when ticket token is missing or empty', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions/${activeExhibitionId}/validate-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketToken: '   ' }),
    });

    const data = (await res.json()) as any;
    expect(res.status).toBe(400);
    expect(data.error || data.message).toMatch(/Ticket token is required/i);
  });

  it('rejects validation for an unissued or malformed token with 404', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions/${activeExhibitionId}/validate-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketToken: 'NK-EXH-9999-FAKE-TOKEN' }),
    });

    const data = (await res.json()) as any;
    expect(res.status).toBe(404);
    expect(data.error || data.message).toMatch(/Invalid exhibition ticket token/i);
  });

  it('rejects cross-exhibition token reuse with 400', async () => {
    // Attempt to use Exhibition B ticket on Exhibition A
    const res = await fetch(`${baseUrl}/api/exhibitions/${activeExhibitionId}/validate-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketToken: secondExhTicketToken }),
    });

    const data = (await res.json()) as any;
    expect(res.status).toBe(400);
    expect(data.error || data.message).toMatch(/Ticket is not valid for this exhibition hall/i);
  });

  it('enforces hardened room entry against cross-exhibition tokens with 403', async () => {
    // Attempt room entry on Exhibition A with Exhibition B ticket
    const res = await fetch(
      `${baseUrl}/api/exhibitions/${activeExhibitionId}/room?token=${encodeURIComponent(secondExhTicketToken)}`
    );

    const data = (await res.json()) as any;
    expect(res.status).toBe(403);
    expect(data.error || data.message).toMatch(/Ticket is not valid for this exhibition hall/i);
  });

  it('grants room entry via GET /room when valid token is supplied', async () => {
    const res = await fetch(
      `${baseUrl}/api/exhibitions/${activeExhibitionId}/room?token=${encodeURIComponent(standardTicketToken)}`
    );

    const data = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(data.exhibition.id).toBe(activeExhibitionId);
    expect(data.accessPass.ticketToken).toBe(standardTicketToken);
    expect(data.artworks.length).toBeGreaterThan(0);
  });

  it('rejects ticket validation before exhibition schedule opens with 403', async () => {
    // Issue a ticket for the upcoming exhibition directly in DB
    const upcomingTicket = await prisma.exhibitionTicket.create({
      data: {
        ticketToken: `NK-EXH-UPCOMING-${Date.now()}`,
        exhibitionId: upcomingExhibitionId,
        buyerId,
        isVip: false,
      },
    });

    const res = await fetch(`${baseUrl}/api/exhibitions/${upcomingExhibitionId}/validate-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketToken: upcomingTicket.ticketToken }),
    });

    const data = (await res.json()) as any;
    expect(res.status).toBe(403);
    expect(data.error || data.message).toMatch(/Exhibition has not opened yet/i);

    // Curator / Organizer bypass allows organizer to access preview
    const orgRoomRes = await fetch(`${baseUrl}/api/exhibitions/${upcomingExhibitionId}/room`, {
      headers: { Authorization: `Bearer ${organizerToken}` },
    });
    expect(orgRoomRes.status).toBe(200);
  });

  it('rejects ticket validation after exhibition viewing schedule concludes with 400', async () => {
    // Issue a ticket for the concluded exhibition
    const concludedTicket = await prisma.exhibitionTicket.create({
      data: {
        ticketToken: `NK-EXH-CONCLUDED-${Date.now()}`,
        exhibitionId: concludedExhibitionId,
        buyerId,
        isVip: false,
      },
    });

    const res = await fetch(`${baseUrl}/api/exhibitions/${concludedExhibitionId}/validate-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketToken: concludedTicket.ticketToken }),
    });

    const data = (await res.json()) as any;
    expect(res.status).toBe(400);
    expect(data.error || data.message).toMatch(/concluded its viewing schedule/i);
  });

  it('enforces VIP window restrictions: rejects standard pass and grants VIP pass', async () => {
    // 1. Standard ticket validation during VIP window fails with 403
    const standardRes = await fetch(`${baseUrl}/api/exhibitions/${vipExhibitionId}/validate-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketToken: standardTicketForVipExhToken }),
    });

    const standardData = (await standardRes.json()) as any;
    expect(standardRes.status).toBe(403);
    expect(standardData.error || standardData.message).toMatch(/reserved for VIP Collectors Pass holders/i);

    // 2. VIP ticket validation during VIP window succeeds with 200
    const vipRes = await fetch(`${baseUrl}/api/exhibitions/${vipExhibitionId}/validate-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketToken: vipTicketToken }),
    });

    const vipData = (await vipRes.json()) as any;
    expect(vipRes.status).toBe(200);
    expect(vipData.valid).toBe(true);
    expect(vipData.accessGranted).toBe(true);
    expect(vipData.ticket.isVip).toBe(true);
    expect(vipData.exhibition.isVipActive).toBe(true);
  });

  it('rejects ticket purchase or upgrade on a concluded exhibition with 400', async () => {
    const purchaseRes = await fetch(`${baseUrl}/api/exhibitions/${concludedExhibitionId}/ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherBuyerToken}`,
      },
      body: JSON.stringify({ isVip: false }),
    });

    const data = (await purchaseRes.json()) as any;
    expect(purchaseRes.status).toBe(400);
    expect(data.error || data.message).toMatch(/viewing schedule has concluded/i);
  });

  it('rejects room entry for visitors on concluded exhibition with 400, but permits organizer archival access with 200', async () => {
    // 1. Regular buyer attempting room entry is rejected
    const visitorRoomRes = await fetch(`${baseUrl}/api/exhibitions/${concludedExhibitionId}/room`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const visitorData = (await visitorRoomRes.json()) as any;
    expect(visitorRoomRes.status).toBe(400);
    expect(visitorData.error || visitorData.message).toMatch(/concluded its viewing schedule/i);

    // 2. Organizer attempting room entry is granted archival access with 200
    const orgRoomRes = await fetch(`${baseUrl}/api/exhibitions/${concludedExhibitionId}/room`, {
      headers: { Authorization: `Bearer ${organizerToken}` },
    });
    const orgData = (await orgRoomRes.json()) as any;
    expect(orgRoomRes.status).toBe(200);
    expect(orgData.exhibition.id).toBe(concludedExhibitionId);
    expect(orgData.accessPass.ticketToken).toBe('CURATOR-ACCESS');
  });
});


