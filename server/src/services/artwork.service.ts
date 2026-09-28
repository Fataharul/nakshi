import { prisma } from '../config/prisma';
import { CreateArtworkInput, UpdateArtworkInput } from '../utils/artwork.validation';
import { Role } from '@prisma/client';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

const DEFAULT_ARTWORK_IMAGE =
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80';

export class ArtworkService {
  /**
   * Format Prisma Artwork record into standard JSON response object
   */
  private static formatArtwork(artwork: any) {
    return {
      id: artwork.id,
      title: artwork.title,
      description: artwork.description,
      medium: artwork.medium,
      dimensions: artwork.dimensions ?? null,
      price: Number(artwork.price),
      imageUrl: artwork.imageUrl,
      imageHash: artwork.imageHash ?? null,
      availability: artwork.availability,
      moderationStatus: artwork.moderationStatus,
      artistId: artwork.artistId,
      artist: artwork.artist
        ? {
            id: artwork.artist.id,
            name: artwork.artist.name,
            email: artwork.artist.email,
            avatarUrl: artwork.artist.avatarUrl ?? null,
            bio: artwork.artist.bio ?? null,
          }
        : undefined,
      createdAt: artwork.createdAt,
      updatedAt: artwork.updatedAt,
    };
  }

  /**
   * Creates a new artwork record for an authenticated ARTIST user.
   */
  public static async createArtwork(artistId: string, input: CreateArtworkInput) {
    // Verify artist exists and possesses ARTIST role
    const artist = await prisma.user.findUnique({
      where: { id: artistId },
    });

    if (!artist) {
      throw new AppError('Artist user not found', 404);
    }

    if (artist.role !== Role.ARTIST) {
      throw new AppError('Only users with the ARTIST role are authorized to create artwork listings', 403);
    }

    const imageUrl = input.imageUrl && input.imageUrl.trim().length > 0 ? input.imageUrl.trim() : DEFAULT_ARTWORK_IMAGE;

    const artwork = await prisma.artwork.create({
      data: {
        artistId,
        title: input.title,
        description: input.description,
        medium: input.medium,
        dimensions: input.dimensions || null,
        price: input.price,
        imageUrl,
        availability: input.availability || 'AVAILABLE',
        moderationStatus: 'APPROVED',
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
    });

    return this.formatArtwork(artwork);
  }

  /**
   * Retrieves all artworks published by a specific artist.
   */
  public static async getArtistArtworks(artistId: string) {
    const artworks = await prisma.artwork.findMany({
      where: { artistId },
      orderBy: { createdAt: 'desc' },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
    });

    return artworks.map((item) => this.formatArtwork(item));
  }

  /**
   * Retrieves a single artwork by ID.
   */
  public static async getArtworkById(id: string) {
    const artwork = await prisma.artwork.findUnique({
      where: { id },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
    });

    if (!artwork) {
      throw new AppError('Artwork record not found', 404);
    }

    return this.formatArtwork(artwork);
  }

  /**
   * Public storefront details for an artist including artworks and stats.
   */
  public static async getArtistStorefront(artistId: string) {
    const artist = await prisma.user.findUnique({
      where: { id: artistId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
        role: true,
      },
    });

    if (!artist) {
      throw new AppError('Artist storefront not found', 404);
    }

    const artworks = await this.getArtistArtworks(artistId);

    const stats = {
      totalArtworks: artworks.length,
      approvedArtworks: artworks.filter((a) => a.moderationStatus === 'APPROVED').length,
      pendingArtworks: artworks.filter((a) => a.moderationStatus === 'PENDING').length,
      flaggedArtworks: artworks.filter((a) => a.moderationStatus === 'FLAGGED').length,
      soldArtworks: artworks.filter((a) => a.availability === 'SOLD').length,
      totalEarningsCredits: 0,
    };

    return {
      artist,
      artworks,
      stats,
    };
  }
}
