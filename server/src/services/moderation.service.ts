import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';
import { calculateSimilarityScore } from '../utils/similarity.util';

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
   * Automatically discovers and routes any flagged listings lacking an open ModerationReview record.
   */
  public static async getQueue() {
    // 1. Detect any orphaned FLAGGED artworks that do not currently have an open ModerationReview
    const orphanedArtworks = await prisma.artwork.findMany({
      where: {
        moderationStatus: 'FLAGGED',
        flaggedAsSource: {
          none: {
            actionTaken: null,
          },
        },
      },
      select: {
        id: true,
        imageHash: true,
      },
    });

    // Auto-route orphaned flagged artworks to the review queue
    for (const orphan of orphanedArtworks) {
      let suspectedMatchId: string | null = null;
      let maxSimilarity = 80.0;

      if (orphan.imageHash && orphan.imageHash.length === 16) {
        const potentialMatches = await prisma.artwork.findMany({
          where: {
            id: { not: orphan.id },
            imageHash: { not: null },
            moderationStatus: { not: 'REJECTED' },
          },
          select: { id: true, imageHash: true },
        });

        for (const match of potentialMatches) {
          if (match.imageHash && match.imageHash.length === 16) {
            try {
              const score = calculateSimilarityScore(orphan.imageHash, match.imageHash);
              if (score > maxSimilarity) {
                maxSimilarity = score;
                suspectedMatchId = match.id;
              }
            } catch {}
          }
        }
      }

      await prisma.moderationReview.create({
        data: {
          sourceArtworkId: orphan.id,
          suspectedMatchId,
          similarityScore: maxSimilarity,
          actionTaken: null,
          adminNotes: 'Auto-routed flagged listing to administrator review queue',
        },
      });
    }

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

  /**
   * Flags an artwork listing and routes it to the administrator review queue.
   */
  public static async flagListing(id: string, adminId: string, reason?: string) {
    // 1. Verify admin user
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== Role.ADMIN) {
      throw new AppError('Forbidden: Only platform administrators are authorized to moderate artwork listings.', 403);
    }

    // 2. Verify artwork exists
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
      throw new AppError('Artwork listing not found.', 404);
    }

    // 3. Mark artwork as FLAGGED
    const updatedArtwork = await prisma.artwork.update({
      where: { id },
      data: { moderationStatus: 'FLAGGED' },
    });

    // 4. Find suspected match if artwork has imageHash
    let suspectedMatchId: string | null = null;
    let maxSimilarity = 80.0;

    if (artwork.imageHash && artwork.imageHash.length === 16) {
      const candidates = await prisma.artwork.findMany({
        where: {
          id: { not: id },
          imageHash: { not: null },
          moderationStatus: { not: 'REJECTED' },
        },
        select: { id: true, imageHash: true, imageUrl: true },
      });

      for (const cand of candidates) {
        if (cand.imageHash && cand.imageHash.length === 16) {
          try {
            const score = calculateSimilarityScore(artwork.imageHash, cand.imageHash);
            if (score > maxSimilarity) {
              maxSimilarity = score;
              suspectedMatchId = cand.id;
            }
          } catch {}
        }
      }
    }

    // 5. Create or update pending ModerationReview record
    let review = await prisma.moderationReview.findFirst({
      where: { sourceArtworkId: id, actionTaken: null },
    });

    if (review) {
      review = await prisma.moderationReview.update({
        where: { id: review.id },
        data: {
          suspectedMatchId: suspectedMatchId || review.suspectedMatchId,
          similarityScore: maxSimilarity,
          adminNotes: reason || review.adminNotes || 'Manually flagged by administrator',
          adminId,
        },
      });
    } else {
      review = await prisma.moderationReview.create({
        data: {
          sourceArtworkId: id,
          suspectedMatchId,
          similarityScore: maxSimilarity,
          actionTaken: null,
          adminNotes: reason || 'Manually flagged by administrator',
          adminId,
        },
      });
    }

    return {
      message: `Artwork "${artwork.title}" successfully flagged and routed to the administrator review queue.`,
      artwork: {
        id: updatedArtwork.id,
        title: updatedArtwork.title,
        moderationStatus: updatedArtwork.moderationStatus,
      },
      review,
    };
  }

  /**
   * Retrieves resolved moderation reviews (where actionTaken is not null).
   */
  public static async getHistory() {
    const history = await prisma.moderationReview.findMany({
      where: {
        actionTaken: { not: null },
      },
      orderBy: { reviewedAt: 'desc' },
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

    return history.map((r) => ({
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
  }

  /**
   * Retrieves summary statistics for the moderation queue.
   */
  public static async getStats() {
    const pendingCount = await prisma.artwork.count({
      where: { moderationStatus: 'FLAGGED' },
    });

    const approvedCount = await prisma.moderationReview.count({
      where: { actionTaken: 'APPROVED' },
    });

    const rejectedCount = await prisma.moderationReview.count({
      where: { actionTaken: 'REJECTED' },
    });

    const avgSimilarity = await prisma.moderationReview.aggregate({
      _avg: {
        similarityScore: true,
      },
    });

    return {
      pendingCount,
      approvedCount,
      rejectedCount,
      averageSimilarity: avgSimilarity._avg.similarityScore
        ? Number(avgSimilarity._avg.similarityScore.toFixed(1))
        : 80.0,
    };
  }
}

