import { describe, it, expect, vi, afterEach } from 'vitest';
import { ExhibitionAnalyticsService } from '../../src/services/exhibition-analytics.service';
import { ExhibitionService } from '../../src/services/exhibition.service';
import { AppError } from '../../src/services/auth.service';
import { prisma } from '../../src/config/prisma';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ExhibitionAnalyticsService visit tracking (T-081)', () => {
  it('does not record a visit when room access is denied', async () => {
    vi.spyOn(ExhibitionService, 'getRoom').mockRejectedValueOnce(
      new AppError('Exhibition access pass required.', 403)
    );
    const create = vi.spyOn(prisma.exhibitionVisit, 'create');

    await expect(ExhibitionAnalyticsService.startVisit('e1', 'u1')).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('records a visit when room access is granted', async () => {
    vi.spyOn(ExhibitionService, 'getRoom').mockResolvedValueOnce({} as any);
    vi.spyOn(prisma.exhibitionVisit, 'create').mockResolvedValueOnce({
      id: 'v1',
      enteredAt: new Date(),
    } as any);

    const result = await ExhibitionAnalyticsService.startVisit('e1', 'u1');
    expect(result.visitId).toBe('v1');
  });

  it('throws 404 when the visit does not exist', async () => {
    vi.spyOn(prisma.exhibitionVisit, 'findUnique').mockResolvedValueOnce(null);
    await expect(ExhibitionAnalyticsService.heartbeat('e1', 'v1')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 404 when the visit belongs to a different exhibition', async () => {
    vi.spyOn(prisma.exhibitionVisit, 'findUnique').mockResolvedValueOnce({
      id: 'v1',
      exhibitionId: 'other',
      userId: null,
      lastSeenAt: new Date(),
    } as any);
    await expect(ExhibitionAnalyticsService.heartbeat('e1', 'v1')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 403 when the visit belongs to another user', async () => {
    vi.spyOn(prisma.exhibitionVisit, 'findUnique').mockResolvedValueOnce({
      id: 'v1',
      exhibitionId: 'e1',
      userId: 'owner',
      lastSeenAt: new Date(),
    } as any);
    await expect(ExhibitionAnalyticsService.heartbeat('e1', 'v1', 'intruder')).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('caps idle gaps at 90 seconds so viewing time is not inflated', async () => {
    vi.spyOn(prisma.exhibitionVisit, 'findUnique').mockResolvedValueOnce({
      id: 'v1',
      exhibitionId: 'e1',
      userId: null,
      lastSeenAt: new Date(Date.now() - 500 * 1000),
    } as any);
    const update = vi
      .spyOn(prisma.exhibitionVisit, 'update')
      .mockResolvedValueOnce({ durationSeconds: 90 } as any);

    const result = await ExhibitionAnalyticsService.heartbeat('e1', 'v1');

    const call = update.mock.calls[0][0] as any;
    expect(call.data.durationSeconds).toEqual({ increment: 90 });
    expect(result.durationSeconds).toBe(90);
  });

  it('credits the real elapsed time when the gap is below the cap', async () => {
    vi.spyOn(prisma.exhibitionVisit, 'findUnique').mockResolvedValueOnce({
      id: 'v1',
      exhibitionId: 'e1',
      userId: null,
      lastSeenAt: new Date(Date.now() - 30 * 1000),
    } as any);
    const update = vi
      .spyOn(prisma.exhibitionVisit, 'update')
      .mockResolvedValueOnce({ durationSeconds: 30 } as any);

    await ExhibitionAnalyticsService.heartbeat('e1', 'v1');

    const increment = (update.mock.calls[0][0] as any).data.durationSeconds.increment;
    expect(increment).toBeGreaterThanOrEqual(29);
    expect(increment).toBeLessThanOrEqual(31);
  });
});