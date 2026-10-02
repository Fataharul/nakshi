import { prisma } from '../config/prisma';
import { AppError } from './auth.service';
import { CreateAuctionInput } from '../utils/auction.validation';
import { AuctionStatus, ArtworkAvailability } from '@prisma/client';

export class AuctionService {
  /**
   * Format Prisma Auction record into standard JSON response object
   */
  private static formatAuction(auction: any) {
    return {
      id: auction.id,
      artworkId: auction.artworkId,
      startingBid: Number(auction.startingBid),
      currentHighestBid: auction.currentHighestBid ? Number(auction.currentHighestBid) : null,
      minIncrement: Number(auction.minIncrement),
      startTime: auction.startTime,
      endTime: auction.endTime,
      status: auction.status,
      winnerId: auction.winnerId,
      createdAt: auction.createdAt,
      updatedAt: auction.updatedAt,
      artwork: auction.artwork ? {
        id: auction.artwork.id,
        title: auction.artwork.title,
        medium: auction.artwork.medium,
        imageUrl: auction.artwork.imageUrl,
        availability: auction.artwork.availability,
        artist: auction.artwork.artist ? {
          id: auction.artwork.artist.id,
          name: auction.artwork.artist.name,
        } : undefined,
      } : undefined,
    };
  }

  public static async createAuction(artistId: string, data: CreateAuctionInput) {
    // 1. Verify artwork exists and belongs to the artist
    const artwork = await prisma.artwork.findUnique({
      where: { id: data.artworkId },
    });

    if (!artwork) {
      throw new AppError('Artwork not found', 404);
    }

    if (artwork.artistId !== artistId) {
      throw new AppError('You do not have permission to auction this artwork', 403);
    }

    // 2. Check if eligible (only APPROVED and AVAILABLE artworks)
    // Wait, the requirements say 'eligible for auction according to existing business rules'. 
    // Usually it needs to be APPROVED (or not REJECTED) and AVAILABLE.
    if (artwork.availability !== ArtworkAvailability.AVAILABLE) {
      throw new AppError(`Artwork is not available for auction (current status: ${artwork.availability})`, 400);
    }
    if (artwork.moderationStatus === 'REJECTED' || artwork.moderationStatus === 'FLAGGED') {
       throw new AppError('Artwork is not eligible for auction due to moderation status', 400);
    }

    // 3. Prevent Duplicate/Overlapping Auctions
    // Check if there are any UPCOMING or ACTIVE auctions for this artwork
    const existingAuction = await prisma.auction.findFirst({
      where: {
        artworkId: data.artworkId,
        status: {
          in: [AuctionStatus.UPCOMING, AuctionStatus.ACTIVE]
        }
      }
    });

    if (existingAuction) {
      throw new AppError('This artwork already has an active or upcoming auction', 400);
    }

    // 4. Create the auction and update artwork availability atomically
    const auction = await prisma.$transaction(async (tx) => {
      // Determine initial status based on start time
      const now = new Date();
      const startTime = new Date(data.startTime);
      const initialStatus = startTime <= now ? AuctionStatus.ACTIVE : AuctionStatus.UPCOMING;

      const newAuction = await tx.auction.create({
        data: {
          artworkId: data.artworkId,
          startingBid: data.startingBid,
          minIncrement: data.minIncrement,
          startTime: data.startTime,
          endTime: data.endTime,
          status: initialStatus,
        },
        include: {
          artwork: {
            include: {
              artist: true,
            }
          }
        }
      });

      // Mark artwork as RESERVED so it cannot be purchased via direct sale while auction is active/upcoming
      await tx.artwork.update({
        where: { id: data.artworkId },
        data: { availability: ArtworkAvailability.RESERVED },
      });

      return newAuction;
    });

    return this.formatAuction(auction);
  }

  public static async getMyAuctions(artistId: string) {
    const auctions = await prisma.auction.findMany({
      where: {
        artwork: {
          artistId: artistId,
        }
      },
      include: {
        artwork: {
          include: {
            artist: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    return auctions.map(this.formatAuction);
  }
}
