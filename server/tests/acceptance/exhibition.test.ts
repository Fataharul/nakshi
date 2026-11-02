import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../../src/server';
import { prisma } from '../../src/config/prisma';

describe('Exhibition & VIP Viewing Schedule Acceptance Tests', () => {
  let serverInstance: http.Server;
  let baseUrl: string;
  const uniqueId = Date.now();

  let organizerToken: string;
  let organizerId: string;
  let otherOrganizerToken: string;
  let otherOrganizerId: string;
  let buyerToken: string;
  let buyerId: string;
  let standardTicketToken: string;
  let vipTicketToken: string;
  let exhibitionId: string;

  const organizerUser = {
    name: `Curator Alpha ${uniqueId}`,
    email: `organizer_alpha_${uniqueId}@nakshi.test`,
    password: 'Password123!',
    role: 'ORGANIZER',
    bio: 'Curator of heritage art exhibitions and digital folk craft galleries.',
  };

  const otherOrganizerUser = {
    name: `Curator Beta ${uniqueId}`,
    email: `organizer_beta_${uniqueId}@nakshi.test`,
    password: 'Password123!',
    role: 'ORGANIZER',
    bio: 'Independent exhibition curator.',
  };

  const buyerUser = {
    name: `Collector Buyer ${uniqueId}`,
    email: `buyer_exh_${uniqueId}@nakshi.test`,
    password: 'Password123!',
    role: 'BUYER',
  };

  beforeAll(async () => {
    // Start test server on dynamic port
    await new Promise<void>((resolve) => {
      serverInstance = app.listen(0, () => {
        const address = serverInstance.address() as AddressInfo;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });

    // 1. Register primary Organizer
    const orgRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(organizerUser),
    });
    const orgData = (await orgRes.json()) as any;
    organizerToken = orgData.token;
    organizerId = orgData.user.id;

    // 2. Register second Organizer (for cross-organizer RBAC testing)
    const otherOrgRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(otherOrganizerUser),
    });
    const otherOrgData = (await otherOrgRes.json()) as any;
    otherOrganizerToken = otherOrgData.token;
    otherOrganizerId = otherOrgData.user.id;

    // 3. Register Buyer user
    const buyerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buyerUser),
    });
    const buyerData = (await buyerRes.json()) as any;
    buyerToken = buyerData.token;
    buyerId = buyerData.user.id;

    // Seed buyer wallet with credits for ticket purchase tests
    await prisma.wallet.update({
      where: { userId: buyerId },
      data: { balance: 500 },
    });
  });

  afterAll(async () => {
    // Cleanup created test records
    try {
      if (exhibitionId) {
        await prisma.exhibition.deleteMany({ where: { id: exhibitionId } });
      }
      await prisma.user.deleteMany({
        where: {
          id: { in: [organizerId, otherOrganizerId, buyerId].filter(Boolean) },
        },
      });
    } catch (e) {
      // Ignore cleanup error
    }

    if (serverInstance) {
      await new Promise<void>((resolve) => serverInstance.close(() => resolve()));
    }
  });

  it('rejects exhibition creation without authentication (401)', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Unauthenticated Exhibition',
        description: 'Should fail authentication check.',
        startTime: '2026-12-01T10:00:00.000Z',
        endTime: '2026-12-10T18:00:00.000Z',
      }),
    });

    expect(res.status).toBe(401);
  });

  it('rejects exhibition creation by unauthorized BUYER role (403)', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        title: 'Buyer Unauthorized Exhibition',
        description: 'Should fail RBAC check.',
        startTime: '2026-12-01T10:00:00.000Z',
        endTime: '2026-12-10T18:00:00.000Z',
      }),
    });

    expect(res.status).toBe(403);
  });

  it('allows ORGANIZER to create an exhibition with initial VIP viewing schedule (201)', async () => {
    const payload = {
      title: `Living Heritage of Jamdani & Kantha ${uniqueId}`,
      description: 'A curated virtual retrospective showcasing traditional Bengali textile motifs.',
      ticketPrice: 20.0,
      startTime: '2026-12-01T10:00:00.000Z',
      endTime: '2026-12-15T18:00:00.000Z',
      isVipEnabled: true,
      vipStartTime: '2026-11-29T10:00:00.000Z',
      vipEndTime: '2026-12-01T09:59:59.000Z',
    };

    const res = await fetch(`${baseUrl}/api/exhibitions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${organizerToken}`,
      },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(201);
    const data = (await res.json()) as any;
    expect(data.exhibition).toBeDefined();
    expect(data.exhibition.title).toBe(payload.title);
    expect(data.exhibition.isVipEnabled).toBe(true);
    expect(data.exhibition.vipStartTime).toBe(payload.vipStartTime);
    expect(data.exhibition.vipEndTime).toBe(payload.vipEndTime);
    expect(data.exhibition.vipStatus).toBe('SCHEDULED');
    expect(data.exhibition.vipDuration).toContain('preview');
    expect(data.exhibition.organizerId).toBe(organizerId);

    exhibitionId = data.exhibition.id;

    // Verify timestamps are accurately stored in PostgreSQL database
    const storedInDb = await prisma.exhibition.findUnique({
      where: { id: exhibitionId },
    });
    expect(storedInDb).toBeDefined();
    expect(storedInDb?.vipStartTime).toBeInstanceOf(Date);
    expect(storedInDb?.vipEndTime).toBeInstanceOf(Date);
    expect(storedInDb?.vipStartTime?.toISOString()).toBe(payload.vipStartTime);
    expect(storedInDb?.vipEndTime?.toISOString()).toBe(payload.vipEndTime);
  });

  it('retrieves public exhibitions list (200)', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(Array.isArray(data.exhibitions)).toBe(true);
    const created = data.exhibitions.find((e: any) => e.id === exhibitionId);
    expect(created).toBeDefined();
    expect(created.vipStatus).toBe('SCHEDULED');
  });

  it('retrieves organizer-specific exhibitions via GET /api/exhibitions/organizer/my (200)', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions/organizer/my`, {
      headers: {
        Authorization: `Bearer ${organizerToken}`,
      },
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(Array.isArray(data.exhibitions)).toBe(true);
    expect(data.exhibitions.some((e: any) => e.id === exhibitionId)).toBe(true);
  });

  it('rejects VIP schedule update when unauthenticated (401)', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/vip-schedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isVipEnabled: true,
        vipStartTime: '2026-11-28T10:00:00.000Z',
        vipEndTime: '2026-11-30T10:00:00.000Z',
      }),
    });

    expect(res.status).toBe(401);
  });

  it('rejects VIP schedule update by a different organizer (403)', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/vip-schedule`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherOrganizerToken}`,
      },
      body: JSON.stringify({
        isVipEnabled: true,
        vipStartTime: '2026-11-28T10:00:00.000Z',
        vipEndTime: '2026-11-30T10:00:00.000Z',
      }),
    });

    expect(res.status).toBe(403);
  });

  it('rejects VIP schedule update with invalid inverted dates (400)', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/vip-schedule`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${organizerToken}`,
      },
      body: JSON.stringify({
        isVipEnabled: true,
        vipStartTime: '2026-11-30T10:00:00.000Z',
        vipEndTime: '2026-11-28T10:00:00.000Z',
      }),
    });

    expect(res.status).toBe(400);
    const data = (await res.json()) as any;
    expect(JSON.stringify(data)).toContain('after VIP start time');
  });

  it('successfully updates VIP viewing schedule window (200)', async () => {
    const newSchedule = {
      isVipEnabled: true,
      vipStartTime: '2026-11-27T10:00:00.000Z',
      vipEndTime: '2026-11-30T18:00:00.000Z',
    };

    const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/vip-schedule`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${organizerToken}`,
      },
      body: JSON.stringify(newSchedule),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.exhibition).toBeDefined();
    expect(data.exhibition.vipStartTime).toBe(newSchedule.vipStartTime);
    expect(data.exhibition.vipEndTime).toBe(newSchedule.vipEndTime);
    expect(data.exhibition.isVipEnabled).toBe(true);
    expect(data.exhibition.vipStatus).toBe('SCHEDULED');

    // Verify updated timestamps are accurately persisted in PostgreSQL database
    const updatedInDb = await prisma.exhibition.findUnique({
      where: { id: exhibitionId },
    });
    expect(updatedInDb).toBeDefined();
    expect(updatedInDb?.vipStartTime).toBeInstanceOf(Date);
    expect(updatedInDb?.vipEndTime).toBeInstanceOf(Date);
    expect(updatedInDb?.vipStartTime?.toISOString()).toBe(newSchedule.vipStartTime);
    expect(updatedInDb?.vipEndTime?.toISOString()).toBe(newSchedule.vipEndTime);
  });

  it('allows disabling VIP viewing schedule window (200)', async () => {
    const disablePayload = {
      isVipEnabled: false,
      vipStartTime: null,
      vipEndTime: null,
    };

    const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/vip-schedule`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${organizerToken}`,
      },
      body: JSON.stringify(disablePayload),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.exhibition.isVipEnabled).toBe(false);
    expect(data.exhibition.vipStartTime).toBeNull();
    expect(data.exhibition.vipEndTime).toBeNull();
    expect(data.exhibition.vipStatus).toBe('NOT_CONFIGURED');

    // Verify disabled VIP timestamps are set to null in PostgreSQL database
    const disabledInDb = await prisma.exhibition.findUnique({
      where: { id: exhibitionId },
    });
    expect(disabledInDb).toBeDefined();
    expect(disabledInDb?.vipStartTime).toBeNull();
    expect(disabledInDb?.vipEndTime).toBeNull();
  });

  it('re-configures VIP schedule for ticket and access gating tests (200)', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/vip-schedule`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${organizerToken}`,
      },
      body: JSON.stringify({
        isVipEnabled: true,
        vipStartTime: '2026-11-28T10:00:00.000Z',
        vipEndTime: '2026-11-30T23:59:59.000Z',
      }),
    });
    expect(res.status).toBe(200);
  });

  it('allows buyer to purchase a standard ticket and a VIP pass with credits (201)', async () => {
    // 1. Buy Standard Ticket
    const stdRes = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ isVip: false }),
    });
    expect(stdRes.status).toBe(201);
    const stdData = (await stdRes.json()) as any;
    expect(stdData.ticket).toBeDefined();
    expect(stdData.ticket.isVip).toBe(false);
    expect(stdData.ticket.ticketToken).toMatch(/^NK-EXH-\d{4}-[A-Z0-9]{4}$/);
    standardTicketToken = stdData.ticket.ticketToken;

    // 2. Buy VIP Pass
    const vipRes = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ isVip: true }),
    });
    expect(vipRes.status).toBe(201);
    const vipData = (await vipRes.json()) as any;
    expect(vipData.ticket).toBeDefined();
    expect(vipData.ticket.isVip).toBe(true);
    expect(vipData.ticket.ticketToken).toMatch(/^NK-EXH-\d{4}-[A-Z0-9]{4}$/);
    vipTicketToken = vipData.ticket.ticketToken;
  });

  it('rejects VIP entry before vipStartTime (403 Forbidden with VIP_NOT_STARTED)', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/enter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        ticketToken: vipTicketToken,
        simulatedTime: '2026-11-27T12:00:00.000Z', // Before vipStartTime
      }),
    });

    expect(res.status).toBe(403);
    const data = (await res.json()) as any;
    expect(data.error).toContain('VIP viewing window has not commenced yet');
    expect(data.code).toBe('VIP_NOT_STARTED');
  });

  it('rejects standard ticket holder during active VIP preview window (403 with VIP_PREVIEW_ONLY)', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/enter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        ticketToken: standardTicketToken,
        simulatedTime: '2026-11-29T12:00:00.000Z', // Active VIP window, but before public opening (2026-12-01)
      }),
    });

    expect(res.status).toBe(403);
    const data = (await res.json()) as any;
    expect(data.error).toContain('exclusive VIP preview');
    expect(data.code).toBe('VIP_PREVIEW_ONLY');
  });

  it('grants entry to VIP pass holder during active VIP window (200 OK)', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/enter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        ticketToken: vipTicketToken,
        simulatedTime: '2026-11-29T12:00:00.000Z', // Active VIP window
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.allowed).toBe(true);
    expect(data.accessType).toBe('VIP');
    expect(data.exhibition).toBeDefined();
    expect(Array.isArray(data.artworks)).toBe(true);
  });

  it('grants entry to standard ticket holder during public opening hours (200 OK)', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/enter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        ticketToken: standardTicketToken,
        simulatedTime: '2026-12-05T12:00:00.000Z', // Inside public dates (2026-12-01 to 2026-12-15)
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.allowed).toBe(true);
    expect(data.accessType).toBe('GENERAL');
  });

  it('rejects entry after exhibition conclusion (403 Forbidden with EXHIBITION_ENDED)', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/enter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        ticketToken: vipTicketToken,
        simulatedTime: '2026-12-25T12:00:00.000Z', // After endTime
      }),
    });

    expect(res.status).toBe(403);
    const data = (await res.json()) as any;
    expect(data.error).toContain('concluded');
    expect(data.code).toBe('EXHIBITION_ENDED');
  });

  it('always grants entry to the exhibition curator at any timestamp (200 OK)', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/enter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${organizerToken}`,
      },
      body: JSON.stringify({
        simulatedTime: '2026-11-20T10:00:00.000Z', // Way before VIP start
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.allowed).toBe(true);
    expect(data.accessType).toBe('ORGANIZER');
  });

  describe('GET /api/exhibitions/:id/analytics Acceptance Tests', () => {
    it('returns 401 Unauthorized when request has no authentication header', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/analytics`);
      expect(res.status).toBe(401);
    });

    it('returns 403 Forbidden when accessed by a regular buyer user', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/analytics`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('returns 403 Forbidden when accessed by a non-owner organizer', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/analytics`, {
        headers: { Authorization: `Bearer ${otherOrganizerToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('returns 404 Not Found when exhibition does not exist', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/non-existent-uuid/analytics`, {
        headers: { Authorization: `Bearer ${organizerToken}` },
      });
      expect(res.status).toBe(404);
    });

    it('returns 200 OK with calculated metrics and curatorial report text for creator organizer', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/analytics`, {
        headers: { Authorization: `Bearer ${organizerToken}` },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.analytics).toBeDefined();

      const { analytics } = data;
      expect(analytics.exhibitionId).toBe(exhibitionId);
      expect(analytics.title).toBeDefined();
      expect(analytics.organizerName).toContain('Curator Alpha');

      // Financials
      expect(typeof analytics.revenue.totalRevenue).toBe('number');
      expect(typeof analytics.revenue.vipRevenue).toBe('number');
      expect(typeof analytics.revenue.standardRevenue).toBe('number');
      expect(analytics.revenue.totalRevenue).toBeGreaterThanOrEqual(0);

      // Tickets
      expect(analytics.tickets.totalTicketsSold).toBeGreaterThanOrEqual(1);

      // Attendance
      expect(analytics.attendance.totalVisits).toBeGreaterThanOrEqual(1);
      expect(typeof analytics.attendance.conversionRate).toBe('number');

      // Curatorial Report Output
      expect(analytics.reportOutput).toBeDefined();
      expect(analytics.reportOutput).toContain('NAKSHI VIRTUAL EXHIBITION CURATORIAL ANALYTICS REPORT');
      expect(analytics.reportOutput).not.toContain('NaN');
    });
  });
});
