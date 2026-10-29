import { describe, it, expect, vi, afterEach } from 'vitest';
import { Role } from '@prisma/client';
import { ExhibitionAnalyticsService } from '../../src/services/exhibition-analytics.service';
import { AppError } from '../../src/services/auth.service';
import { prisma } from '../../src/config/prisma';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ExhibitionAnalyticsService.getAnalytics', () => {
  it('throws 404 when exhibition does not exist', async () => {
    vi.spyOn(prisma.exhibition, 'findUnique').mockResolvedValueOnce(null);
    await expect(
      ExhibitionAnalyticsService.getAnalytics('missing', { id: 'u1', role: Role.ORGANIZER })
    ).rejects.toThrow(AppError);
  });

  it('throws 403 when organizer does not own the exhibition', async () => {
    vi.spyOn(prisma.exhibition, 'findUnique').mockResolvedValueOnce({
      id: 'e1',
      title: 'Kantha Show',
      organizerId: 'owner',
    } as any);

    await expect(
      ExhibitionAnalyticsService.getAnalytics('e1', { id: 'other', role: Role.ORGANIZER })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('returns average viewing time and ticket revenue', async () => {
    vi.spyOn(prisma.exhibition, 'findUnique').mockResolvedValueOnce({
      id: 'e1',
      title: 'Kantha Show',
      organizerId: 'owner',
    } as any);
    vi.spyOn(prisma.exhibitionVisit, 'findMany').mockResolvedValueOnce([
      { durationSeconds: 60 },
      { durationSeconds: 120 },
    ] as any);
    vi.spyOn(prisma.creditTransaction, 'findMany').mockResolvedValueOnce([
      { amount: '25.00' },
      { amount: '37.50' },
    ] as any);
    vi.spyOn(prisma.exhibitionTicket, 'count').mockResolvedValueOnce(2);

    const result = await ExhibitionAnalyticsService.getAnalytics('e1', {
      id: 'owner',
      role: Role.ORGANIZER,
    });

    expect(result.totalVisits).toBe(2);
    expect(result.averageViewingTimeSeconds).toBe(90);
    expect(result.ticketsSold).toBe(2);
    expect(result.totalTicketRevenue).toBe(62.5);
  });

  it('returns zeros when there is no activity', async () => {
    vi.spyOn(prisma.exhibition, 'findUnique').mockResolvedValueOnce({
      id: 'e1',
      title: 'Empty',
      organizerId: 'owner',
    } as any);
    vi.spyOn(prisma.exhibitionVisit, 'findMany').mockResolvedValueOnce([] as any);
    vi.spyOn(prisma.creditTransaction, 'findMany').mockResolvedValueOnce([] as any);
    vi.spyOn(prisma.exhibitionTicket, 'count').mockResolvedValueOnce(0);

    const result = await ExhibitionAnalyticsService.getAnalytics('e1', {
      id: 'admin',
      role: Role.ADMIN,
    });

    expect(result.averageViewingTimeSeconds).toBe(0);
    expect(result.totalTicketRevenue).toBe(0);
  });
});