import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { CreateArtworkInput, UpdateArtworkInput, ArtworkQueryInput } from '../utils/artwork.validation';
import { Role } from '@prisma/client';
import {
  generateDHash,
  calculateSimilarityScore,
  DEFAULT_SIMILARITY_THRESHOLD,
} from '../utils/similarity.util';

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
   * Resolves an image URL or local path to a Buffer for Sharp processing
   */
  private static async resolveImageBuffer(imageUrl: string): Promise<Buffer | null> {
    if (!imageUrl || !imageUrl.trim()) return null;
    const trimmed = imageUrl.trim();

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const res = await fetch(trimmed, { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      } catch {
        // remote image fetch failed or timed out
      }
    }

    if (trimmed.startsWith('/uploads/')) {
      const relative = trimmed.replace(/^\/uploads\/?/, '');
      const candidates = [
        path.resolve(process.env.UPLOAD_DIR || './uploads', relative),
        path.resolve('./server/uploads', relative),
        path.resolve('.' + trimmed),
        path.resolve('./server' + trimmed),
        path.resolve(__dirname, '../../uploads', relative),
        path.resolve(__dirname, '../../../uploads', relative),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          return fs.readFileSync(candidate);
        }
      }
    }

    if (fs.existsSync(trimmed)) {
      return fs.readFileSync(trimmed);
    }

    return null;
  }

  /**
   * Computes a 16-character hexadecimal dHash string from the image buffer,
   * falling back to a deterministic 16-character hex hash if the image cannot be read.
   */
  private static async computeArtworkHash(imageUrl: string, precalculatedHash?: string | null): Promise<string> {
    if (precalculatedHash && /^[0-9a-f]{16}$/i.test(precalculatedHash)) {
      return precalculatedHash.toLowerCase();
    }

    try {
      const buffer = await this.resolveImageBuffer(imageUrl);
      if (buffer) {
        return await generateDHash(buffer);
      }
    } catch (err) {
      console.warn('[ArtworkService] generateDHash failed on image buffer:', err);
    }

    // Deterministic 16-hex fallback hash based on URL string so identical URLs match 100%
    return crypto.createHash('md5').update(imageUrl || 'default-image').digest('hex').substring(0, 16);
  }

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
      like: artwork.like ?? 0,
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
      comments: artwork.comments
        ? artwork.comments.map((c: any) => ({
            id: c.id,
            content: c.content,
            createdAt: c.createdAt,
            user: {
              id: c.user?.id,
              name: c.user?.name,
              avatarUrl: c.user?.avatarUrl ?? null,
              role: c.user?.role,
            },
          }))
        : [],
      createdAt: artwork.createdAt,
      updatedAt: artwork.updatedAt,
    };
  }

  /**
   * Creates a new artwork record for an authenticated ARTIST user.
   * Performs perceptual duplicate detection using 64-bit dHash and Hamming distance.
   */
  public static async createArtwork(artistId: string, input: CreateArtworkInput) {
    // Verify artist exists and possesses ARTIST role
    const artist = await prisma.user.findUnique({
      where: { id: artistId },
    });

    if (!artist) {
      throw new AppError('Artist user not found', 404);
    }

    if (artist.role !== Role.ARTIST && artist.role !== Role.ORGANIZER && artist.role !== Role.ADMIN) {
      throw new AppError('Only users with the ARTIST or ORGANIZER role are authorized to create artwork listings', 403);
    }

    const imageUrl = input.imageUrl && input.imageUrl.trim().length > 0 ? input.imageUrl.trim() : DEFAULT_ARTWORK_IMAGE;

    // 1. Compute perceptual dHash for new artwork
    const newHash = await this.computeArtworkHash(imageUrl, input.imageHash);

    // 2. Query existing artworks with an imageHash to evaluate similarity
    const existingArtworks = await prisma.artwork.findMany({
      where: {
        imageHash: { not: null },
        moderationStatus: { not: 'REJECTED' },
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        imageHash: true,
      },
    });

    let maxSimilarity = 0;
    let suspectedMatchId: string | null = null;

    // Do not compare if user is using the default placeholder image
    const isUsingPlaceholder = !input.imageUrl || input.imageUrl.trim() === DEFAULT_ARTWORK_IMAGE;

    if (!isUsingPlaceholder) {
      for (const existing of existingArtworks) {
        // Do not match against listings that use the system default placeholder
        if (existing.imageUrl === DEFAULT_ARTWORK_IMAGE) continue;

        if (existing.imageHash && existing.imageHash.length === 16) {
          try {
            const score = calculateSimilarityScore(newHash, existing.imageHash);
            if (score > maxSimilarity) {
              maxSimilarity = score;
              suspectedMatchId = existing.id;
            }
          } catch {
            // skip invalid hash
          }
        }
      }
    }

    // 3. Evaluate against 80% threshold
    const threshold = process.env.SIMILARITY_THRESHOLD
      ? parseFloat(process.env.SIMILARITY_THRESHOLD)
      : DEFAULT_SIMILARITY_THRESHOLD;

    const isDuplicate = !isUsingPlaceholder && maxSimilarity > threshold;
    const moderationStatus = isDuplicate ? 'FLAGGED' : 'APPROVED';

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
        imageHash: newHash,
        availability: input.availability || 'AVAILABLE',
        moderationStatus,
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

    // 4. If flagged as duplicate (> 80%), create ModerationReview record for Admin Review Queue
    if (isDuplicate) {
      await prisma.moderationReview.create({
        data: {
          sourceArtworkId: artwork.id,
          suspectedMatchId,
          similarityScore: maxSimilarity,
          actionTaken: null,
        },
      });
    }

    return this.formatArtwork(artwork);
  }

  /**
   * Retrieves all artworks filtered by optional query params: medium, style, search, minPrice, maxPrice, availability, pagination.
   * By default, excludes unapproved / flagged / rejected listings from public browsing.
   */
  public static async getArtworks(query: ArtworkQueryInput) {
    const where: any = {};

    if (!query.moderationStatus || query.moderationStatus === 'APPROVED') {
      where.moderationStatus = 'APPROVED';
    } else if (query.moderationStatus !== 'ALL') {
      where.moderationStatus = query.moderationStatus;
    }

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

    if (query.creatorName && query.creatorName.trim()) {
      where.artist = {
        name: {
          contains: query.creatorName.trim(),
          mode: 'insensitive',
        },
      };
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

    let orderBy: any = { createdAt: 'desc' };
    if (query.sortBy === 'PRICE_ASC') {
      orderBy = { price: 'asc' };
    } else if (query.sortBy === 'PRICE_DESC') {
      orderBy = { price: 'desc' };
    } else if (query.sortBy === 'TITLE_ASC') {
      orderBy = { title: 'asc' };
    } else {
      orderBy = { createdAt: 'desc' };
    }

    const [total, artworks] = await Promise.all([
      prisma.artwork.count({ where }),
      prisma.artwork.findMany({
        where,
        orderBy,
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
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                role: true,
              },
            },
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
   * Adds a comment to an artwork.
   */
  public static async addComment(artworkId: string, userId: string, content: string) {
    if (!content || !content.trim()) {
      throw new AppError('Comment content cannot be empty', 400);
    }
    if (content.trim().length > 500) {
      throw new AppError('Comment content cannot exceed 500 characters', 400);
    }

    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
      select: { id: true },
    });

    if (!artwork) {
      throw new AppError('Artwork record not found', 404);
    }

    const comment = await prisma.artworkComment.create({
      data: {
        artworkId,
        userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    return {
      id: comment.id,
      artworkId: comment.artworkId,
      content: comment.content,
      createdAt: comment.createdAt,
      user: comment.user,
    };
  }

  /**
   * Retrieves comments for an artwork.
   */
  public static async getComments(artworkId: string) {
    const comments = await prisma.artworkComment.findMany({
      where: { artworkId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    return comments.map((c) => ({
      id: c.id,
      artworkId: c.artworkId,
      content: c.content,
      createdAt: c.createdAt,
      user: c.user,
    }));
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
      include: {
        orders: { select: { id: true } },
        auctionItems: { select: { id: true, status: true } },
      },
    });

    if (!existing) {
      throw new AppError('Artwork record not found', 404);
    }

    if (existing.artistId !== artistId) {
      throw new AppError('Forbidden: You are not authorized to delete an artwork owned by another artist', 403);
    }

    if (existing.availability === 'SOLD' || existing.orders.length > 0) {
      throw new AppError('Bad Request: Cannot delete an artwork that has already been purchased or has order records', 400);
    }

    if (existing.auctionItems.some((a) => a.status === 'ACTIVE' || a.status === 'UPCOMING')) {
      throw new AppError('Bad Request: Cannot delete an artwork that is currently scheduled or active in an auction', 400);
    }

    await prisma.artwork.delete({
      where: { id },
    });

    return true;
  }
  // like
  public static async likeArtwork(id: string) {
    const existing = await prisma.artwork.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Artwork record not found', 404);
    }

    const artwork = await prisma.artwork.update({
      where: { id },
      data: { like: { increment: 1 } },
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
}
