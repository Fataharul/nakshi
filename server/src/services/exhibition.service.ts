import { prisma } from '../config/prisma';
import { AppError } from './auth.service';
import { TransactionType, Role } from '@prisma/client';

export interface CreateExhibitionInput {
  title: string;
  description: string;
  bannerUrl?: string;
  ticketPrice?: number;
  startTime: string | Date;
  endTime: string | Date;
  vipStartTime?: string | Date;
  vipEndTime?: string | Date;
  layoutConfig?: any;
  artworkIds?: string[];
}

export class ExhibitionService {
  /**
   * Helper to determine live status
   */
  public static getExhibitionStatus(exh: {
    startTime: Date;
    endTime: Date;
    vipStartTime?: Date | null;
    vipEndTime?: Date | null;
  }): 'UPCOMING' | 'ACTIVE' | 'VIP_EXCLUSIVE' | 'CLOSED' {
    const now = new Date();
    const start = new Date(exh.startTime);
    const end = new Date(exh.endTime);

    if (now > end) return 'CLOSED';

    if (exh.vipStartTime && exh.vipEndTime) {
      const vipStart = new Date(exh.vipStartTime);
      const vipEnd = new Date(exh.vipEndTime);
      if (now >= vipStart && now <= vipEnd) {
        return 'VIP_EXCLUSIVE';
      }
    }

    if (now >= start && now <= end) {
      return 'ACTIVE';
    }

    return 'UPCOMING';
  }

  /**
   * Get all exhibitions for public browsing with dynamic status
   */
  public static async getAll(filter?: { status?: string; organizerId?: string }) {
    const where: any = {};
    if (filter?.organizerId) {
      where.organizerId = filter.organizerId;
    }

    const exhibitions = await prisma.exhibition.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        artworks: {
          include: {
            artwork: {
              select: {
                id: true,
                title: true,
                medium: true,
                imageUrl: true,
                price: true,
              },
            },
          },
        },
        _count: {
          select: {
            tickets: true,
            artworks: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    const formatted = exhibitions.map((exh) => {
      const status = this.getExhibitionStatus(exh);
      return {
        id: exh.id,
        title: exh.title,
        description: exh.description,
        bannerUrl: exh.bannerUrl,
        ticketPrice: Number(exh.ticketPrice),
        startTime: exh.startTime,
        endTime: exh.endTime,
        vipStartTime: exh.vipStartTime,
        vipEndTime: exh.vipEndTime,
        layoutConfig: exh.layoutConfig,
        organizer: exh.organizer,
        artworksCount: exh._count.artworks,
        ticketsCount: exh._count.tickets,
        sampleArtworks: exh.artworks.slice(0, 4).map((a) => a.artwork),
        status,
        createdAt: exh.createdAt,
      };
    });

    if (filter?.status && filter.status !== 'ALL') {
      return formatted.filter((e) => e.status === filter.status);
    }

    return formatted;
  }

  /**
   * Get exhibition details by ID
   */
  public static async getById(id: string, currentUserId?: string) {
    const exh = await prisma.exhibition.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bio: true,
          },
        },
        artworks: {
          include: {
            artwork: {
              include: {
                artist: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            wallPosition: 'asc',
          },
        },
        _count: {
          select: {
            tickets: true,
            artworks: true,
          },
        },
      },
    });

    if (!exh) {
      throw new AppError('Exhibition not found', 404);
    }

    let userTicket = null;
    if (currentUserId) {
      userTicket = await prisma.exhibitionTicket.findFirst({
        where: {
          exhibitionId: id,
          buyerId: currentUserId,
        },
      });
    }

    const status = this.getExhibitionStatus(exh);

    return {
      id: exh.id,
      title: exh.title,
      description: exh.description,
      bannerUrl: exh.bannerUrl,
      ticketPrice: Number(exh.ticketPrice),
      startTime: exh.startTime,
      endTime: exh.endTime,
      vipStartTime: exh.vipStartTime,
      vipEndTime: exh.vipEndTime,
      layoutConfig: exh.layoutConfig,
      organizer: exh.organizer,
      artworksCount: exh._count.artworks,
      ticketsCount: exh._count.tickets,
      artworks: exh.artworks.map((ea) => ({
        id: ea.id,
        wallPosition: ea.wallPosition,
        posX: ea.posX,
        posY: ea.posY,
        artwork: ea.artwork,
      })),
      status,
      userTicket: userTicket
        ? {
            id: userTicket.id,
            ticketToken: userTicket.ticketToken,
            isVip: userTicket.isVip,
            purchasedAt: userTicket.purchasedAt,
          }
        : null,
      createdAt: exh.createdAt,
    };
  }

  /**
   * Create an exhibition (Organizer / Admin)
   */
  public static async create(organizerId: string, input: CreateExhibitionInput) {
    const user = await prisma.user.findUnique({ where: { id: organizerId } });
    if (!user || (user.role !== Role.ORGANIZER && user.role !== Role.ADMIN)) {
      throw new AppError('Only registered Organizers or Admins can create virtual exhibitions', 403);
    }

    if (!input.title || !input.title.trim()) {
      throw new AppError('Exhibition title is required', 400);
    }

    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new AppError('Valid start and end times are required', 400);
    }

    if (endTime <= startTime) {
      throw new AppError('End time must be after start time', 400);
    }

    const ticketPrice = input.ticketPrice !== undefined ? Math.max(0, Number(input.ticketPrice)) : 0;

    const exhibition = await prisma.$transaction(async (tx) => {
      const created = await tx.exhibition.create({
        data: {
          title: input.title.trim(),
          description: input.description?.trim() || '',
          bannerUrl: input.bannerUrl || null,
          ticketPrice,
          startTime,
          endTime,
          vipStartTime: input.vipStartTime ? new Date(input.vipStartTime) : null,
          vipEndTime: input.vipEndTime ? new Date(input.vipEndTime) : null,
          layoutConfig: input.layoutConfig || { walls: ['North Gallery', 'East Gallery', 'South Gallery'] },
          organizerId,
        },
      });

      if (input.artworkIds && input.artworkIds.length > 0) {
        // Enforce that organizers can only showcase their own uploaded artworks
        const ownedArtworks = await tx.artwork.findMany({
          where: {
            id: { in: input.artworkIds },
            artistId: organizerId,
          },
          select: { id: true },
        });

        const ownedIds = new Set(ownedArtworks.map((a) => a.id));
        const unownedIds = input.artworkIds.filter((id) => !ownedIds.has(id));

        if (unownedIds.length > 0) {
          throw new AppError('Organizers can only showcase their own uploaded artworks in their exhibitions', 400);
        }

        for (let i = 0; i < input.artworkIds.length; i++) {
          await tx.exhibitionArtwork.create({
            data: {
              exhibitionId: created.id,
              artworkId: input.artworkIds[i],
              wallPosition: i + 1,
              posX: (i % 3) * 30 + 15,
              posY: Math.floor(i / 3) * 40 + 20,
            },
          });
        }
      }

      return created;
    });

    return exhibition;
  }

  /**
   * Purchase a ticket for an exhibition using internal credits
   */
  public static async purchaseTicket(userId: string, exhibitionId: string, isVip: boolean = false) {
    const exhibition = await prisma.exhibition.findUnique({
      where: { id: exhibitionId },
      include: { organizer: true },
    });

    if (!exhibition) {
      throw new AppError('Exhibition not found', 404);
    }

    // Check if user already holds a ticket
    const existingTicket = await prisma.exhibitionTicket.findFirst({
      where: {
        exhibitionId,
        buyerId: userId,
      },
    });

    if (existingTicket) {
      // If already holding ticket
      if (isVip && !existingTicket.isVip) {
        // Upgrade to VIP
        const vipUpgradeCost = Math.round(Number(exhibition.ticketPrice) * 0.5) || 25;
        const wallet = await prisma.wallet.findUnique({ where: { userId } });
        if (!wallet || Number(wallet.balance) < vipUpgradeCost) {
          throw new AppError(`Insufficient credits for VIP upgrade (${vipUpgradeCost} Credits required)`, 400);
        }

        return await prisma.$transaction(async (tx) => {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: vipUpgradeCost } },
          });

          await tx.creditTransaction.create({
            data: {
              walletId: wallet.id,
              amount: vipUpgradeCost,
              type: TransactionType.EXHIBITION_TICKET,
              description: `VIP Pass Upgrade for "${exhibition.title}"`,
              referenceId: exhibitionId,
            },
          });

          const updated = await tx.exhibitionTicket.update({
            where: { id: existingTicket.id },
            data: { isVip: true },
          });

          return updated;
        });
      }

      return existingTicket;
    }

    const basePrice = Number(exhibition.ticketPrice);
    const finalPrice = isVip ? basePrice + Math.round(basePrice * 0.5 || 25) : basePrice;

    // Generate unique token format: NK-EXH-YEAR-HEX
    const year = new Date().getFullYear();
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timePart = Date.now().toString(36).substring(4).toUpperCase();
    const ticketToken = `NK-EXH-${year}-${timePart}-${randPart}`;

    const ticket = await prisma.$transaction(async (tx) => {
      // Deduct internal credits if ticketPrice > 0
      if (finalPrice > 0) {
        const wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet || Number(wallet.balance) < finalPrice) {
          throw new AppError(`Insufficient credits. Ticket requires ${finalPrice} Credits. Please top up your wallet.`, 400);
        }

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: finalPrice } },
        });

        await tx.creditTransaction.create({
          data: {
            walletId: wallet.id,
            amount: finalPrice,
            type: TransactionType.EXHIBITION_TICKET,
            description: `${isVip ? 'VIP' : 'Standard'} Ticket for "${exhibition.title}"`,
            referenceId: exhibitionId,
          },
        });

        // Credit the organizer with the ticket proceeds
        const organizerWallet = await tx.wallet.findUnique({
          where: { userId: exhibition.organizerId },
        });
        if (organizerWallet) {
          await tx.wallet.update({
            where: { id: organizerWallet.id },
            data: { balance: { increment: finalPrice } },
          });

          await tx.creditTransaction.create({
            data: {
              walletId: organizerWallet.id,
              amount: finalPrice,
              type: TransactionType.SALE_CREDIT,
              description: `Ticket revenue from "${exhibition.title}"`,
              referenceId: exhibitionId,
            },
          });
        }
      }

      const createdTicket = await tx.exhibitionTicket.create({
        data: {
          ticketToken,
          exhibitionId,
          buyerId: userId,
          isVip,
        },
      });

      return createdTicket;
    });

    return ticket;
  }

  /**
   * Access virtual exhibition room
   * Validates access window and ticket authorization
   */
  public static async getRoom(exhibitionId: string, userId?: string, ticketToken?: string) {
    const exhibition = await prisma.exhibition.findUnique({
      where: { id: exhibitionId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        artworks: {
          include: {
            artwork: {
              include: {
                artist: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            wallPosition: 'asc',
          },
        },
      },
    });

    if (!exhibition) {
      throw new AppError('Exhibition hall not found', 404);
    }

    const now = new Date();
    const end = new Date(exhibition.endTime);

    // If exhibition has closed
    if (now > end) {
      throw new AppError('This exhibition has concluded its viewing schedule', 400);
    }

    let isOrganizer = false;
    let ticket = null;

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && (user.id === exhibition.organizerId || user.role === Role.ADMIN)) {
        isOrganizer = true;
      } else {
        ticket = await prisma.exhibitionTicket.findFirst({
          where: {
            exhibitionId,
            buyerId: userId,
          },
        });
      }
    }

    if (!isOrganizer && !ticket && ticketToken) {
      ticket = await prisma.exhibitionTicket.findUnique({
        where: { ticketToken },
      });
    }

    // Free exhibition allows all users without a ticket
    const isFree = Number(exhibition.ticketPrice) === 0;

    if (!isOrganizer && !ticket && !isFree) {
      throw new AppError('Exhibition access pass required. Please reserve your ticket to enter.', 403);
    }

    // Check VIP Window restrictions
    if (exhibition.vipStartTime && exhibition.vipEndTime) {
      const vipStart = new Date(exhibition.vipStartTime);
      const vipEnd = new Date(exhibition.vipEndTime);

      if (now >= vipStart && now <= vipEnd) {
        if (!isOrganizer && (!ticket || !ticket.isVip)) {
          throw new AppError('The hall is currently reserved for VIP Collectors Pass holders. General admission opens following the VIP window.', 403);
        }
      }
    }

    return {
      exhibition: {
        id: exhibition.id,
        title: exhibition.title,
        description: exhibition.description,
        bannerUrl: exhibition.bannerUrl,
        organizer: exhibition.organizer,
        startTime: exhibition.startTime,
        endTime: exhibition.endTime,
        layoutConfig: exhibition.layoutConfig,
      },
      artworks: exhibition.artworks.map((ea) => ({
        id: ea.id,
        wallPosition: ea.wallPosition,
        posX: ea.posX,
        posY: ea.posY,
        artwork: ea.artwork,
      })),
      accessPass: ticket
        ? {
            ticketToken: ticket.ticketToken,
            isVip: ticket.isVip,
            purchasedAt: ticket.purchasedAt,
          }
        : isOrganizer
        ? { ticketToken: 'CURATOR-ACCESS', isVip: true, purchasedAt: new Date() }
        : { ticketToken: 'COMPLIMENTARY-PASS', isVip: false, purchasedAt: new Date() },
    };
  }
}
