import { prisma } from '../config/prisma';
import { AppError } from './auth.service';
import { ExhibitionService } from './exhibition.service';
import { Role, TransactionType } from '@prisma/client';
import {
  calculateAverageViewingTime,
  calculateTicketRevenue,
} from '../utils/exhibition-analytics.util';

// Heartbeat gap longer than this is treated as idle and not counted
const MAX_HEARTBEAT_GAP_SECONDS = 90;

export class ExhibitionAnalyticsService {
  /**
   * Start a visit. Reuses the room access rules (ticket, VIP window, closed)
   * so only valid entrants are recorded.
   */
  public static async startVisit(exhibitionId: string, userId?: string, ticketToken?: string) {
    await ExhibitionService.getRoom(exhibitionId, userId, ticketToken);

    const visit = await prisma.exhibitionVisit.create({
      data: { exhibitionId, userId: userId ?? null },
      select: { id: true, enteredAt: true },
    });

    return { visitId: visit.id, enteredAt: visit.enteredAt };
  }

  /**
   * Add elapsed active time to a visit. Idle gaps are capped so
   * viewing time is never inflated.
   */
  public static async heartbeat(exhibitionId: string, visitId: string, userId?: string) {
    const visit = await prisma.exhibitionVisit.findUnique({ where: { id: visitId } });

    if (!visit || visit.exhibitionId !== exhibitionId) {
      throw new AppError('Visit not found', 404);
    }

    if (visit.userId && visit.userId !== userId) {
      throw new AppError('This visit belongs to another user', 403);
    }

    const now = new Date();
    const gapSeconds = Math.max(0, Math.floor((now.getTime() - visit.lastSeenAt.getTime()) / 1000));
    const increment = Math.min(gapSeconds, MAX_HEARTBEAT_GAP_SECONDS);

    const updated = await prisma.exhibitionVisit.update({
      where: { id: visitId },
      data: {
        lastSeenAt: now,
        durationSeconds: { increment },
      },
      select: { durationSeconds: true },
    });

    return { durationSeconds: updated.durationSeconds };
  }

  /**
   * T-082: average viewing time and total ticket revenue for one exhibition.
   * Only the owning organizer or an admin can read it.
   */
  public static async getAnalytics(
    exhibitionId: string,
    requester: { id: string; role: Role }
  ) {
    const exhibition = await prisma.exhibition.findUnique({
      where: { id: exhibitionId },
      select: { id: true, title: true, organizerId: true },
    });

    if (!exhibition) {
      throw new AppError('Exhibition not found', 404);
    }

    if (requester.role !== Role.ADMIN && exhibition.organizerId !== requester.id) {
      throw new AppError('You can only view analytics for your own exhibitions', 403);
    }

    const [visits, ticketTransactions, ticketsSold] = await Promise.all([
      prisma.exhibitionVisit.findMany({
        where: { exhibitionId },
        select: { durationSeconds: true },
      }),
      prisma.creditTransaction.findMany({
        where: {
          type: TransactionType.EXHIBITION_TICKET,
          referenceId: exhibitionId,
        },
        select: { amount: true },
      }),
      prisma.exhibitionTicket.count({ where: { exhibitionId } }),
    ]);

    return {
      exhibitionId: exhibition.id,
      title: exhibition.title,
      totalVisits: visits.length,
      averageViewingTimeSeconds: calculateAverageViewingTime(
        visits.map((v) => v.durationSeconds)
      ),
      ticketsSold,
      totalTicketRevenue: calculateTicketRevenue(ticketTransactions.map((t) => t.amount)),
    };
  }
}