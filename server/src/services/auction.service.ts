import { prisma } from '../config/prisma';
import { AppError } from './auth.service';
import { CreateAuctionInput, SubmitBidInput } from '../utils/auction.validation';
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

  public static async submitBid(auctionId: string, bidderId: string, data: SubmitBidInput) {
    const amount = data.amount;

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { artwork: true },
    });

    if (!auction) {
      throw new AppError('Auction not found', 404);
    }

    const now = new Date();
    if (auction.status === AuctionStatus.CANCELLED || auction.status === AuctionStatus.ENDED) {
      throw new AppError('Auction has already ended and bidding is locked', 400);
    }

    if (now > new Date(auction.endTime)) {
      await prisma.auction.update({
        where: { id: auctionId },
        data: { status: AuctionStatus.ENDED },
      });
      throw new AppError('Auction has already ended and bidding is locked', 400);
    }


    if (now < new Date(auction.startTime)) {
      throw new AppError('Auction has not started yet', 400);
    }


    if (auction.artwork.artistId === bidderId) {
      throw new AppError('Artists cannot bid on their own auctions', 400);
    }

    const startingBid = Number(auction.startingBid);
    const minIncrement = Number(auction.minIncrement);
    const currentHighest = auction.currentHighestBid !== null && auction.currentHighestBid !== undefined
      ? Number(auction.currentHighestBid)
      : null;

    if (currentHighest === null) {
      if (amount < startingBid) {
        throw new AppError(`Bid amount must be at least the starting bid of ${startingBid}`, 400);
      }
    } else {
      if (amount <= currentHighest) {
        throw new AppError('Bid amount must be higher than the current highest bid', 400);
      }
      const minRequiredBid = currentHighest + minIncrement;
      if (amount < minRequiredBid) {
        throw new AppError(
          `Bid amount must meet the minimum increment step of ${minIncrement}. Minimum required bid is ${minRequiredBid}`,
          400
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      if (auction.status === AuctionStatus.UPCOMING) {
        await tx.auction.update({
          where: { id: auctionId },
          data: { status: AuctionStatus.ACTIVE },
        });
      }

      const bid = await tx.auctionBid.create({
        data: {
          auctionId,
          bidderId,
          amount,
        },
        include: {
          bidder: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const updatedAuction = await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentHighestBid: amount,
          status: AuctionStatus.ACTIVE,
        },
        include: {
          artwork: {
            include: { artist: true },
          },
        },
      });

      return { bid, auction: updatedAuction };
    });

    return {
      bid: {
        id: result.bid.id,
        auctionId: result.bid.auctionId,
        bidderId: result.bid.bidderId,
        amount: Number(result.bid.amount),
        createdAt: result.bid.createdAt,
      },
      auction: this.formatAuction(result.auction),
      highestBidder: {
        id: result.bid.bidder.id,
        name: result.bid.bidder.name,
      },
    };
  }
}


