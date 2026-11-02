import { prisma } from '../config/prisma';
import { AppError } from './auth.service';
import {
  CreateExhibitionInput,
  ConfigureVipScheduleInput,
  computeVipStatus,
  formatVipDuration,
  VipScheduleStatus,
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
}
