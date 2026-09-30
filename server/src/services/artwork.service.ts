import { prisma } from '../config/prisma';
import { CreateArtworkInput, UpdateArtworkInput, ArtworkQueryInput } from '../utils/artwork.validation';
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
      style: artwork.style ?? null,
      dimensions: artwork.dimensions ?? null,
      height: artwork.height ?? null,
      width: artwork.width ?? null,
      depth: artwork.depth ?? null,
      weight: artwork.weight ?? null,
      weightUnit: artwork.weightUnit ?? 'kg',
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
        style: input.style || null,
        dimensions: input.dimensions || null,
        height: input.height ?? null,
        width: input.width ?? null,
        depth: input.depth ?? null,
        weight: input.weight ?? null,
        weightUnit: input.weightUnit || 'kg',
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
   * Retrieves all artworks filtered by optional query params: medium, style, search, minPrice, maxPrice, availability, pagination.
   */
  public static async getArtworks(query: ArtworkQueryInput) {
    const where: any = {};

    if (query.availability && query.availability !== 'ALL') {
      where.availability = query.availability;
    }

    if (query.medium && query.medium.trim() && query.medium !== 'ALL') {
      where.medium = {
        equals: query.medium.trim(),
        mode: 'insensitive',
      };
    }

    if (query.style && query.style.trim() && query.style !== 'ALL') {
      where.style = {
        equals: query.style.trim(),
        mode: 'insensitive',
      };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) {
        where.price.gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        where.price.lte = query.maxPrice;
      }
    }

    if (query.search && query.search.trim()) {
      const searchTerm = query.search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { medium: { contains: searchTerm, mode: 'insensitive' } },
        { style: { contains: searchTerm, mode: 'insensitive' } },
        { artist: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [total, artworks] = await Promise.all([
      prisma.artwork.count({ where }),
      prisma.artwork.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
      }),
    ]);

    return {
      artworks: artworks.map((item) => this.formatArtwork(item)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

  /**
   * Updates an existing artwork record. Restricted strictly to the artwork owner (artistId).
   */
  public static async updateArtwork(id: string, artistId: string, input: UpdateArtworkInput) {
    const existing = await prisma.artwork.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Artwork record not found', 404);
    }

    if (existing.artistId !== artistId) {
      throw new AppError('Forbidden: You are not authorized to edit an artwork owned by another artist', 403);
    }

    const updated = await prisma.artwork.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.medium !== undefined && { medium: input.medium }),
        ...(input.style !== undefined && { style: input.style || null }),
        ...(input.dimensions !== undefined && { dimensions: input.dimensions }),
        ...(input.height !== undefined && { height: input.height }),
        ...(input.width !== undefined && { width: input.width }),
        ...(input.depth !== undefined && { depth: input.depth }),
        ...(input.weight !== undefined && { weight: input.weight }),
        ...(input.weightUnit !== undefined && { weightUnit: input.weightUnit }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.imageUrl !== undefined && input.imageUrl.trim().length > 0 && { imageUrl: input.imageUrl.trim() }),
        ...(input.availability !== undefined && { availability: input.availability }),
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

    return this.formatArtwork(updated);
  }

  /**
   * Deletes an artwork record. Restricted strictly to the artwork owner (artistId).
   */
  public static async deleteArtwork(id: string, artistId: string) {
    const existing = await prisma.artwork.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Artwork record not found', 404);
    }

    if (existing.artistId !== artistId) {
      throw new AppError('Forbidden: You are not authorized to delete an artwork owned by another artist', 403);
    }

    await prisma.artwork.delete({
      where: { id },
    });

    return true;
  }
}
