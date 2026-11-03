import { describe, it, expect, vi, afterEach } from 'vitest';
import { Role } from '@prisma/client';
import { ExhibitionService } from '../../src/services/exhibition.service';
import { prisma } from '../../src/config/prisma';

/**
 * T-076: Test valid, invalid, and expired ticket entry
 * AC: Valid active tickets are accepted and invalid or expired tickets are rejected.
 */

const HOUR = 60 * 60 * 1000;

const makeExhibition = (overrides: Record<string, unknown> = {}) => ({
  id: 'ex1',
  title: 'Kantha Heritage Show',
  description: 'Hand-stitched heritage',
  bannerUrl: null,
  ticketPrice: 25,
  startTime: new Date(Date.now() - HOUR),
  endTime: new Date(Date.now() + HOUR),
  vipStartTime: null,
  vipEndTime: null,
  layoutConfig: null,
  organizerId: 'org1',
  organizer: { id: 'org1', name: 'Curator', avatarUrl: null },
  artworks: [],
  ...overrides,
});

const makeTicket = (overrides: Record<string, unknown> = {}) => ({
  id: 't1',
  ticketToken: 'NK-EXH-2026-AAAA-BBBB',
  exhibitionId: 'ex1',
  buyerId: 'buyer1',
  isVip: false,
  purchasedAt: new Date(),
  ...overrides,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ExhibitionService.getRoom — ticket entry (T-076)', () => {
  describe('valid tickets', () => {
    it('accepts a valid token for an active exhibition', async () => {
      vi.spyOn(prisma.exhibition, 'findUnique').mockResolvedValueOnce(makeExhibition() as any);
      vi.spyOn(prisma.exhibitionTicket, 'findUnique').mockResolvedValueOnce(makeTicket() as any);

      const room = await ExhibitionService.getRoom('ex1', undefined, 'NK-EXH-2026-AAAA-BBBB');

      expect(room.exhibition.id).toBe('ex1');
      expect(room.accessPass.ticketToken).toBe('NK-EXH-2026-AAAA-BBBB');
    });

    it('accepts a logged-in buyer who holds a ticket for the exhibition', async () => {
      vi.spyOn(prisma.exhibition, 'findUnique').mockResolvedValueOnce(makeExhibition() as any);
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({ id: 'buyer1', role: Role.BUYER } as any);
      vi.spyOn(prisma.exhibitionTicket, 'findFirst').mockResolvedValueOnce(makeTicket() as any);

      const room = await ExhibitionService.getRoom('ex1', 'buyer1');

      expect(room.accessPass.ticketToken).toBe('NK-EXH-2026-AAAA-BBBB');
    });

    it('lets visitors into a free exhibition without a ticket', async () => {
      vi.spyOn(prisma.exhibition, 'findUnique').mockResolvedValueOnce(
        makeExhibition({ ticketPrice: 0 }) as any
      );

      const room = await ExhibitionService.getRoom('ex1');

      expect(room.accessPass.ticketToken).toBe('COMPLIMENTARY-PASS');
    });
  });

  describe('invalid tickets', () => {
    it('rejects a token that does not exist with 403', async () => {
      vi.spyOn(prisma.exhibition, 'findUnique').mockResolvedValueOnce(makeExhibition() as any);
      vi.spyOn(prisma.exhibitionTicket, 'findUnique').mockResolvedValueOnce(null);

      await expect(ExhibitionService.getRoom('ex1', undefined, 'NK-FAKE')).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('rejects a token issued for a different exhibition with 403', async () => {
      vi.spyOn(prisma.exhibition, 'findUnique').mockResolvedValueOnce(makeExhibition() as any);
      vi.spyOn(prisma.exhibitionTicket, 'findUnique').mockResolvedValueOnce(
        makeTicket({ exhibitionId: 'another-exhibition' }) as any
      );

      await expect(
        ExhibitionService.getRoom('ex1', undefined, 'NK-EXH-2026-AAAA-BBBB')
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('rejects a visitor with no ticket on a paid exhibition with 403', async () => {
      vi.spyOn(prisma.exhibition, 'findUnique').mockResolvedValueOnce(makeExhibition() as any);

      await expect(ExhibitionService.getRoom('ex1')).rejects.toMatchObject({ statusCode: 403 });
    });

    it('rejects an unknown exhibition with 404', async () => {
      vi.spyOn(prisma.exhibition, 'findUnique').mockResolvedValueOnce(null);

      await expect(ExhibitionService.getRoom('missing')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('expired or not-yet-open schedule', () => {
    it('rejects a valid token once the exhibition period has ended', async () => {
      vi.spyOn(prisma.exhibition, 'findUnique').mockResolvedValueOnce(
        makeExhibition({
          startTime: new Date(Date.now() - 3 * HOUR),
          endTime: new Date(Date.now() - HOUR),
        }) as any
      );
      const ticketLookup = vi
        .spyOn(prisma.exhibitionTicket, 'findUnique')
        .mockResolvedValue(makeTicket() as any);

      await expect(
        ExhibitionService.getRoom('ex1', undefined, 'NK-EXH-2026-AAAA-BBBB')
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(ticketLookup).not.toHaveBeenCalled();
    });

    it('rejects a valid token before the exhibition has opened', async () => {
      vi.spyOn(prisma.exhibition, 'findUnique').mockResolvedValueOnce(
        makeExhibition({
          startTime: new Date(Date.now() + HOUR),
          endTime: new Date(Date.now() + 2 * HOUR),
        }) as any
      );
      vi.spyOn(prisma.exhibitionTicket, 'findUnique').mockResolvedValueOnce(makeTicket() as any);

      await expect(
        ExhibitionService.getRoom('ex1', undefined, 'NK-EXH-2026-AAAA-BBBB')
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('still lets the owning organizer preview before the exhibition opens', async () => {
      vi.spyOn(prisma.exhibition, 'findUnique').mockResolvedValueOnce(
        makeExhibition({
          startTime: new Date(Date.now() + HOUR),
          endTime: new Date(Date.now() + 2 * HOUR),
        }) as any
      );
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({ id: 'org1', role: Role.ORGANIZER } as any);

      const room = await ExhibitionService.getRoom('ex1', 'org1');

      expect(room.accessPass.ticketToken).toBe('CURATOR-ACCESS');
    });
  });
});