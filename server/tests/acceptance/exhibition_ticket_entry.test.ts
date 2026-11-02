import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../../src/server';
import { prisma } from '../../src/config/prisma';

/**
 * T-076: Test valid, invalid, and expired ticket entry
 * AC: Valid active tickets are accepted and invalid or expired tickets are rejected.
 */
describe('Exhibition Ticket Entry Acceptance Tests (T-076)', () => {
  let serverInstance: http.Server;
  let baseUrl: string;
  const uniqueId = Date.now();
  const HOUR = 60 * 60 * 1000;

  let organizerToken: string;
  let organizerId: string;
  let buyerToken: string;
  let buyerId: string;
  let strangerToken: string;
  let strangerId: string;

  let activeExhibitionId: string;
  let otherExhibitionId: string;
  let upcomingExhibitionId: string;
  let expiringExhibitionId: string;
  let validTicketToken: string;
  let expiringTicketToken: string;

  const register = async (label: string, role: 'ORGANIZER' | 'BUYER') => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${label} ${uniqueId}`,
        email: `${label}_${uniqueId}_${Math.random().toString(36).substring(2, 7)}@nakshi.test`,
        password: 'Password123!',
        role,
        ...(role === 'ORGANIZER' ? { bio: 'Exhibition curator.' } : {}),
      }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as any;
    return { token: data.token as string, id: data.user.id as string };
  };

  const createExhibition = async (label: string, startOffsetMs: number, endOffsetMs: number) => {
    const res = await fetch(`${baseUrl}/api/exhibitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${organizerToken}` },
      body: JSON.stringify({
        title: `${label} ${uniqueId}`,
        description: 'Ticket entry test exhibition',
        ticketPrice: 25,
        startTime: new Date(Date.now() + startOffsetMs).toISOString(),
        endTime: new Date(Date.now() + endOffsetMs).toISOString(),
      }),
    });
    expect(res.status).toBe(201);
    return ((await res.json()) as any).exhibition.id as string;
  };

  const buyTicket = async (exhibitionId: string) => {
    const res = await fetch(`${baseUrl}/api/exhibitions/${exhibitionId}/ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(201);
    return ((await res.json()) as any).ticket.ticketToken as string;
  };

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      serverInstance = app.listen(0, () => {
        const address = serverInstance.address() as AddressInfo;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });

    ({ token: organizerToken, id: organizerId } = await register('ticket_org', 'ORGANIZER'));
    ({ token: buyerToken, id: buyerId } = await register('ticket_buyer', 'BUYER'));
    ({ token: strangerToken, id: strangerId } = await register('ticket_stranger', 'BUYER'));

    const topUp = await fetch(`${baseUrl}/api/wallet/top-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ amount: 500 }),
    });
    expect(topUp.status).toBeLessThan(300);

    activeExhibitionId = await createExhibition('Active Hall', -HOUR, 24 * HOUR);
    otherExhibitionId = await createExhibition('Other Hall', -HOUR, 24 * HOUR);
    upcomingExhibitionId = await createExhibition('Upcoming Hall', 2 * HOUR, 26 * HOUR);
    expiringExhibitionId = await createExhibition('Expiring Hall', -2 * HOUR, 24 * HOUR);

    validTicketToken = await buyTicket(activeExhibitionId);
    expiringTicketToken = await buyTicket(expiringExhibitionId);
    await buyTicket(upcomingExhibitionId);

    // Move the exhibition end into the past so its (previously valid) ticket is now expired
    await prisma.exhibition.update({
      where: { id: expiringExhibitionId },
      data: { endTime: new Date(Date.now() - 60 * 1000) },
    });
  });

  afterAll(async () => {
    for (const id of [organizerId, buyerId, strangerId]) {
      if (id) await prisma.user.delete({ where: { id } }).catch(() => {});
    }
    await new Promise<void>((resolve) => serverInstance.close(() => resolve()));
  });

  describe('valid tickets', () => {
    it('accepts a valid ticket token passed as a query parameter', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${activeExhibitionId}/room?token=${validTicketToken}`);
      const data = (await res.json()) as any;
      expect(res.status).toBe(200);
      expect(data.accessPass.ticketToken).toBe(validTicketToken);
    });

    it('accepts a valid ticket token passed in the x-ticket-token header', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${activeExhibitionId}/room`, {
        headers: { 'x-ticket-token': validTicketToken },
      });
      expect(res.status).toBe(200);
    });

    it('accepts the logged-in buyer who owns a ticket', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${activeExhibitionId}/room`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('invalid tickets', () => {
    it('rejects an unknown ticket token with 403', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${activeExhibitionId}/room?token=NK-EXH-FAKE-0000`);
      expect(res.status).toBe(403);
    });

    it('rejects a visitor without any ticket with 403', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${activeExhibitionId}/room`, {
        headers: { Authorization: `Bearer ${strangerToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('rejects a ticket token that belongs to a different exhibition with 403', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${otherExhibitionId}/room?token=${validTicketToken}`);
      expect(res.status).toBe(403);
    });

    it('rejects an anonymous visitor with no token with 403', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${activeExhibitionId}/room`);
      expect(res.status).toBe(403);
    });
  });

  describe('expired or not-yet-open tickets', () => {
    it('rejects a valid ticket after the exhibition period has ended with 400', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${expiringExhibitionId}/room?token=${expiringTicketToken}`);
      const data = (await res.json()) as any;
      expect(res.status).toBe(400);
      expect(data.error).toContain('concluded');
    });

    it('rejects a ticket holder before the exhibition has opened with 403', async () => {
      const res = await fetch(`${baseUrl}/api/exhibitions/${upcomingExhibitionId}/room`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });
      expect(res.status).toBe(403);
    });
  });
});