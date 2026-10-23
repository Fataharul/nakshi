import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export interface ReviewItemInput {
  action: 'APPROVE' | 'APPROVED' | 'REJECT' | 'REJECTED';
  notes?: string;
}

export class ModerationService {
  /**
   * Retrieves all flagged artwork listings in the moderation review queue.
   */
  public static async getQueue() {
    const reviews = await prisma.moderationReview.findMany({
      where: {
        OR: [
          { actionTaken: null },
          { sourceArtwork: { moderationStatus: 'FLAGGED' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sourceArtwork: {
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
        },
        suspectedMatchArtwork: {
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
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedQueue = reviews.map((r) => ({
      id: r.id,
      sourceArtworkId: r.sourceArtworkId,
      suspectedMatchId: r.suspectedMatchId,
      similarityScore: r.similarityScore,
      actionTaken: r.actionTaken,
      adminNotes: r.adminNotes,
      createdAt: r.createdAt,
      reviewedAt: r.reviewedAt,
      sourceArtwork: {
        id: r.sourceArtwork.id,
        title: r.sourceArtwork.title,
        description: r.sourceArtwork.description,
        medium: r.sourceArtwork.medium,
        style: r.sourceArtwork.style,
        dimensions: r.sourceArtwork.dimensions,
        price: Number(r.sourceArtwork.price),
        imageUrl: r.sourceArtwork.imageUrl,
        imageHash: r.sourceArtwork.imageHash,
        moderationStatus: r.sourceArtwork.moderationStatus,
        availability: r.sourceArtwork.availability,
        createdAt: r.sourceArtwork.createdAt,
        artist: r.sourceArtwork.artist,
      },
      suspectedMatchArtwork: r.suspectedMatchArtwork
        ? {
            id: r.suspectedMatchArtwork.id,
            title: r.suspectedMatchArtwork.title,
            description: r.suspectedMatchArtwork.description,
            medium: r.suspectedMatchArtwork.medium,
            style: r.suspectedMatchArtwork.style,
            dimensions: r.suspectedMatchArtwork.dimensions,
            price: Number(r.suspectedMatchArtwork.price),
            imageUrl: r.suspectedMatchArtwork.imageUrl,
            imageHash: r.suspectedMatchArtwork.imageHash,
            moderationStatus: r.suspectedMatchArtwork.moderationStatus,
            availability: r.suspectedMatchArtwork.availability,
            createdAt: r.suspectedMatchArtwork.createdAt,
            artist: r.suspectedMatchArtwork.artist,
          }
        : null,
      admin: r.admin,
    }));

    return formattedQueue;
  }

  /**
   * Reviews a flagged artwork listing, taking an administrative action (APPROVE or REJECT).
   * Supports either review ID or source artwork ID for maximum route flexibility.
   */
  public static async reviewItem(id: string, adminId: string, input: ReviewItemInput) {
    const rawAction = String(input.action).toUpperCase();
    const actionNormalized: 'APPROVED' | 'REJECTED' = rawAction.startsWith('APPROV')
      ? 'APPROVED'
      : rawAction.startsWith('REJECT')
      ? 'REJECTED'
      : (() => {
          throw new AppError("Invalid moderation action. Must be 'APPROVE' or 'REJECT'.", 400);
        })();

    // 1. Verify admin user
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== Role.ADMIN) {
      throw new AppError('Forbidden: Only platform administrators are authorized to moderate artwork listings.', 403);
    }

    // 2. Find ModerationReview record by review ID or sourceArtworkId
    let review = await prisma.moderationReview.findUnique({
      where: { id },
      include: { sourceArtwork: true },
    });

    if (!review) {
      review = await prisma.moderationReview.findFirst({
        where: { sourceArtworkId: id },
        include: { sourceArtwork: true },
      });
    }

    let sourceArtworkId = review ? review.sourceArtworkId : id;

    // Verify source artwork exists
    const artwork = await prisma.artwork.findUnique({
      where: { id: sourceArtworkId },
    });

    if (!artwork) {
      throw new AppError('Flagged artwork listing not found.', 404);
    }

    // 3. Atomically update artwork status and review audit record
    const [updatedArtwork, updatedReview] = await prisma.$transaction([
      prisma.artwork.update({
        where: { id: sourceArtworkId },
        data: {
          moderationStatus: actionNormalized,
        },
      }),
      review
        ? prisma.moderationReview.update({
            where: { id: review.id },
            data: {
              actionTaken: actionNormalized,
              adminId,
              adminNotes: input.notes || null,
              reviewedAt: new Date(),
            },
          })
        : prisma.moderationReview.create({
            data: {
              sourceArtworkId,
              similarityScore: 80.0,
              actionTaken: actionNormalized,
              adminId,
              adminNotes: input.notes || null,
              reviewedAt: new Date(),
            },
          }),
    ]);

    return {
      message: `Artwork listing successfully ${actionNormalized.toLowerCase()}.`,
      actionTaken: actionNormalized,
      artwork: {
        id: updatedArtwork.id,
        title: updatedArtwork.title,
        moderationStatus: updatedArtwork.moderationStatus,
      },
      review: updatedReview,
    };
  }
}
