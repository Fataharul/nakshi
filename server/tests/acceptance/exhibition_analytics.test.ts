import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../../src/server';

describe('Exhibition Analytics Acceptance Tests (T-082)', () => {
  let serverInstance: http.Server;
  let baseUrl: string;
  const uniqueId = Date.now();
  let organizerToken: string;
  let otherOrganizerToken: string;
  let exhibitionId: string;

  const register = async (label: string) => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${label} ${uniqueId}`,
        email: `${label}_${uniqueId}_${Math.random().toString(36).substring(2, 7)}@nakshi.test`,
        password: 'Password123!',
        role: 'ORGANIZER',
        bio: 'Exhibition curator.',
      }),
    });
    expect(res.status).toBe(201);
    return ((await res.json()) as any).token as string;
  };

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      serverInstance = app.listen(0, () => {
        const address = serverInstance.address() as AddressInfo;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });

    organizerToken = await register('owner');
    otherOrganizerToken = await register('other');

    const start = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const exhRes = await fetch(`${baseUrl}/api/exhibitions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${organizerToken}`,
      },
      body: JSON.stringify({
        title: `Analytics Exhibition ${uniqueId}`,
        description: 'Free exhibition for analytics test',
        ticketPrice: 0,
        startTime: start,
        endTime: end,
      }),
    });
    expect(exhRes.status).toBe(201);
    exhibitionId = ((await exhRes.json()) as any).exhibition.id;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => serverInstance.close(() => resolve()));
  });

  it('rejects analytics request without a token', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/analytics`);
    expect(res.status).toBe(401);
  });

  it("blocks another organizer from reading someone else's analytics", async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/analytics`, {
      headers: { Authorization: `Bearer ${otherOrganizerToken}` },
    });
    expect(res.status).toBe(403);
  });

  it('returns zero values before any visit is recorded', async () => {
    const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/analytics`, {
      headers: { Authorization: `Bearer ${organizerToken}` },
    });
    const data = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(data.analytics.totalVisits).toBe(0);
    expect(data.analytics.averageViewingTimeSeconds).toBe(0);
    expect(data.analytics.totalTicketRevenue).toBe(0);
  });

  it('records a visit and counts it in the analytics', async () => {
    const visitRes = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/visits`, {
      method: 'POST',
    });
    expect(visitRes.status).toBe(201);
    const { visitId } = (await visitRes.json()) as any;

    const beat = await fetch(
      `${baseUrl}/api/exhibitions/${exhibitionId}/visits/${visitId}/heartbeat`,
      { method: 'POST' }
    );
    expect(beat.status).toBe(200);

    const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/analytics`, {
      headers: { Authorization: `Bearer ${organizerToken}` },
    });
    const data = (await res.json()) as any;
    expect(data.analytics.totalVisits).toBe(1);
  });
});