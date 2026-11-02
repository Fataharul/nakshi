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
  });

  afterAll(async () => {
    // Cleanup created test records
    try {
      if (exhibitionId) {
        await prisma.exhibition.deleteMany({ where: { id: exhibitionId } });
      }
      await prisma.user.deleteMany({
        where: {
          id: { in: [organizerId, otherOrganizerId].filter(Boolean) },
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
    expect(data.exhibition.vipStatus).toBe('SCHEDULED');
    expect(data.exhibition.vipDuration).toContain('preview');
    expect(data.exhibition.organizerId).toBe(organizerId);

    exhibitionId = data.exhibition.id;
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
  });
});
