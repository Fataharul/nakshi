import { prisma } from '../config/prisma';
import { AppError } from './auth.service';
import {
  CreateExhibitionInput,
  ConfigureVipScheduleInput,
  computeVipStatus,
  formatVipDuration,
  VipScheduleStatus,
  generateTicketToken,
  evaluateExhibitionAccess,
  AccessEvaluationResult,
} from '../utils/exhibition.validation';

export interface FormattedExhibition {
  id: string;
  title: string;
  description: string;
  bannerUrl: string | null;
  ticketPrice: number;
  startTime: string;
  endTime: string;
  vipStartTime: string | null;
  vipEndTime: string | null;
  isVipEnabled: boolean;
  vipStatus: VipScheduleStatus;
  vipDuration: string | null;
  layoutConfig?: any;
  organizerId: string;
  organizer?: {
    id: string;
    name: string;
    email?: string;
  };
  artworksCount?: number;
  ticketsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export class ExhibitionService {
  /**
   * Formats a raw Prisma Exhibition record into a typed API response.
   */
  public static formatExhibition(exhibition: any): FormattedExhibition {
    const now = new Date();
    const isVipConfigured = Boolean(exhibition.vipStartTime && exhibition.vipEndTime);
    const vipStatus = computeVipStatus(now, exhibition.vipStartTime, exhibition.vipEndTime);
    const vipDuration = formatVipDuration(exhibition.vipStartTime, exhibition.vipEndTime);

    return {
      id: exhibition.id,
      title: exhibition.title,
      description: exhibition.description,
      bannerUrl: exhibition.bannerUrl ?? null,
      ticketPrice: Number(exhibition.ticketPrice ?? 0),
      startTime: new Date(exhibition.startTime).toISOString(),
      endTime: new Date(exhibition.endTime).toISOString(),
      vipStartTime: exhibition.vipStartTime ? new Date(exhibition.vipStartTime).toISOString() : null,
      vipEndTime: exhibition.vipEndTime ? new Date(exhibition.vipEndTime).toISOString() : null,
      isVipEnabled: isVipConfigured,
      vipStatus,
      vipDuration,
      layoutConfig: exhibition.layoutConfig ?? null,
      organizerId: exhibition.organizerId,
      organizer: exhibition.organizer
        ? {
            id: exhibition.organizer.id,
            name: exhibition.organizer.name,
            email: exhibition.organizer.email,
          }
        : undefined,
      artworksCount: exhibition._count?.artworks ?? exhibition.artworks?.length ?? 0,
      ticketsCount: exhibition._count?.tickets ?? exhibition.tickets?.length ?? 0,
      createdAt: new Date(exhibition.createdAt).toISOString(),
      updatedAt: new Date(exhibition.updatedAt).toISOString(),
    };
  }

  /**
   * Creates a new exhibition with optional VIP viewing schedule.
   */
  public static async createExhibition(
    organizerId: string,
    data: CreateExhibitionInput
  ): Promise<FormattedExhibition> {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    let vipStartTime: Date | null = null;
    let vipEndTime: Date | null = null;

    if (data.isVipEnabled && data.vipStartTime && data.vipEndTime) {
      vipStartTime = new Date(data.vipStartTime);
      vipEndTime = new Date(data.vipEndTime);
    }

    const exhibition = await prisma.exhibition.create({
      data: {
        title: data.title,
        description: data.description,
        bannerUrl: data.bannerUrl && data.bannerUrl.trim() !== '' ? data.bannerUrl : null,
        ticketPrice: data.ticketPrice,
        startTime,
        endTime,
        vipStartTime,
        vipEndTime,
        organizerId,
      },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { artworks: true, tickets: true },
        },
      },
    });

    return this.formatExhibition(exhibition);
  }

  /**
   * Retrieves all virtual exhibitions for public discovery.
   */
  public static async getExhibitions(): Promise<FormattedExhibition[]> {
    const exhibitions = await prisma.exhibition.findMany({
      orderBy: { startTime: 'asc' },
      include: {
        organizer: {
          select: { id: true, name: true },
        },
        _count: {
          select: { artworks: true, tickets: true },
        },
      },
    });

    return exhibitions.map((e) => this.formatExhibition(e));
  }

  /**
   * Retrieves an individual exhibition by ID.
   */
  public static async getExhibitionById(id: string): Promise<FormattedExhibition> {
    const exhibition = await prisma.exhibition.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
        artworks: {
          include: {
            artwork: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                price: true,
                medium: true,
              },
            },
          },
        },
        _count: {
          select: { artworks: true, tickets: true },
        },
      },
    });

    if (!exhibition) {
      throw new AppError('Exhibition not found', 404);
    }

    return this.formatExhibition(exhibition);
  }

  /**
   * Retrieves exhibitions curated by an organizer.
   */
  public static async getOrganizerExhibitions(organizerId: string): Promise<FormattedExhibition[]> {
    const exhibitions = await prisma.exhibition.findMany({
      where: { organizerId },
      orderBy: { createdAt: 'desc' },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { artworks: true, tickets: true },
        },
      },
    });

    return exhibitions.map((e) => this.formatExhibition(e));
  }

  /**
   * Configures or updates the VIP viewing schedule window for an exhibition.
   * Enforces organizer ownership or administrator privileges.
   */
  public static async updateVipSchedule(
    exhibitionId: string,
    userId: string,
    userRole: string,
    schedule: ConfigureVipScheduleInput
  ): Promise<FormattedExhibition> {
    const exhibition = await prisma.exhibition.findUnique({
      where: { id: exhibitionId },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!exhibition) {
      throw new AppError('Exhibition not found', 404);
    }

    // Authorization guard: Only the exhibition's organizer or an ADMIN can update the schedule
    if (exhibition.organizerId !== userId && userRole !== 'ADMIN') {
      throw new AppError(
        'Forbidden: You are not authorized to configure this exhibition schedule',
        403
      );
    }

    let updatedVipStartTime: Date | null = null;
    let updatedVipEndTime: Date | null = null;

    if (schedule.isVipEnabled && schedule.vipStartTime && schedule.vipEndTime) {
      updatedVipStartTime = new Date(schedule.vipStartTime);
      updatedVipEndTime = new Date(schedule.vipEndTime);

      if (updatedVipEndTime <= updatedVipStartTime) {
        throw new AppError('VIP viewing end time must be after VIP start time', 400);
      }
    }

    const updated = await prisma.exhibition.update({
      where: { id: exhibitionId },
      data: {
        vipStartTime: updatedVipStartTime,
        vipEndTime: updatedVipEndTime,
      },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { artworks: true, tickets: true },
        },
      },
    });

    return this.formatExhibition(updated);
  }

  /**
   * Purchases an admission ticket or VIP access pass for a virtual exhibition.
   * Atomically verifies and deducts internal credits from the buyer's wallet.
   */
  public static async purchaseTicket(
    exhibitionId: string,
    buyerId: string,
    isVip: boolean = false
  ) {
    const exhibition = await prisma.exhibition.findUnique({
      where: { id: exhibitionId },
      include: { organizer: { select: { id: true, name: true } } },
    });

    if (!exhibition) {
      throw new AppError('Exhibition not found', 404);
    }

    const basePrice = Number(exhibition.ticketPrice ?? 0);
    // VIP pass is basePrice * 1.5 (or minimum 10 credits for free general admission)
    const ticketCost = isVip
      ? Math.max(10, Math.round(basePrice * 1.5 * 100) / 100)
      : basePrice;

    // Execute atomic ticket purchase with credit deduction
    const ticket = await prisma.$transaction(async (tx) => {
      // 1. Get or create buyer wallet
      let wallet = await tx.wallet.findUnique({
        where: { userId: buyerId },
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId: buyerId,
            balance: 0,
          },
        });
      }

      // Check sufficient balance
      if (Number(wallet.balance) < ticketCost) {
        throw new AppError(
          `Insufficient credit balance. Required: ${ticketCost.toFixed(2)} credits, Available: ${Number(wallet.balance).toFixed(2)} credits.`,
          400
        );
      }

      // 2. Deduct credits if cost > 0
      if (ticketCost > 0) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              decrement: ticketCost,
            },
          },
        });

        await tx.creditTransaction.create({
          data: {
            walletId: wallet.id,
            amount: -ticketCost,
            type: 'EXHIBITION_TICKET',
            description: `${isVip ? 'VIP Early Access Pass' : 'General Admission Ticket'} for ${exhibition.title}`,
            referenceId: exhibition.id,
          },
        });
      }

      // 3. Issue unique ticket token
      const ticketToken = generateTicketToken();

      const createdTicket = await tx.exhibitionTicket.create({
        data: {
          ticketToken,
          exhibitionId,
          buyerId,
          isVip,
        },
      });

      return createdTicket;
    });

    return {
      id: ticket.id,
      ticketToken: ticket.ticketToken,
      exhibitionId: ticket.exhibitionId,
      buyerId: ticket.buyerId,
      isVip: ticket.isVip,
      cost: ticketCost,
      purchasedAt: ticket.purchasedAt.toISOString(),
    };
  }

  /**
   * Retrieves the authenticated user's ticket for an exhibition.
   */
  public static async getMyTicket(exhibitionId: string, userId: string) {
    const ticket = await prisma.exhibitionTicket.findFirst({
      where: {
        exhibitionId,
        buyerId: userId,
      },
      orderBy: { purchasedAt: 'desc' },
    });

    if (!ticket) return null;

    return {
      id: ticket.id,
      ticketToken: ticket.ticketToken,
      exhibitionId: ticket.exhibitionId,
      buyerId: ticket.buyerId,
      isVip: ticket.isVip,
      purchasedAt: ticket.purchasedAt.toISOString(),
    };
  }

  /**
   * Evaluates timestamp-based access gating to enter a virtual exhibition gallery.
   * Restricts VIP access outside its configured schedule window.
   */
  public static async enterExhibition(
    exhibitionId: string,
    userId: string,
    userRole: string,
    options?: { ticketToken?: string; simulatedTime?: string }
  ) {
    const exhibition = await prisma.exhibition.findUnique({
      where: { id: exhibitionId },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
        artworks: {
          include: {
            artwork: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                price: true,
                medium: true,
              },
            },
          },
        },
        _count: {
          select: { artworks: true, tickets: true },
        },
      },
    });

    if (!exhibition) {
      throw new AppError('Exhibition not found', 404);
    }

    const now = options?.simulatedTime ? new Date(options.simulatedTime) : new Date();

    // Find ticket if user is not organizer or admin
    let ticket: any = null;
    if (userRole !== 'ADMIN' && exhibition.organizerId !== userId) {
      if (options?.ticketToken) {
        ticket = await prisma.exhibitionTicket.findUnique({
          where: { ticketToken: options.ticketToken },
        });

        if (!ticket || ticket.exhibitionId !== exhibitionId || ticket.buyerId !== userId) {
          throw new AppError('Invalid or mismatched exhibition ticket token.', 403);
        }
      } else {
        ticket = await prisma.exhibitionTicket.findFirst({
          where: {
            exhibitionId,
            buyerId: userId,
          },
          orderBy: { purchasedAt: 'desc' },
        });
      }
    }

    const evalResult: AccessEvaluationResult = evaluateExhibitionAccess(
      now,
      exhibition,
      { id: userId, role: userRole },
      ticket
    );

    if (!evalResult.allowed) {
      const err = new AppError(evalResult.message || 'Access restricted', 403);
      (err as any).code = evalResult.reason;
      throw err;
    }

    return {
      allowed: true,
      accessType: evalResult.accessType,
      evaluationTimestamp: now.toISOString(),
      exhibition: this.formatExhibition(exhibition),
      artworks: exhibition.artworks.map((ea) => ({
        id: ea.artwork.id,
        title: ea.artwork.title,
        imageUrl: ea.artwork.imageUrl,
        price: Number(ea.artwork.price),
        medium: ea.artwork.medium,
        wallPosition: ea.wallPosition,
        posX: ea.posX,
        posY: ea.posY,
      })),
      ticket: ticket
        ? {
            id: ticket.id,
            ticketToken: ticket.ticketToken,
            isVip: ticket.isVip,
            purchasedAt: ticket.purchasedAt.toISOString(),
          }
        : null,
    };
  }
}
