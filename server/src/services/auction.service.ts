import { prisma } from '../config/prisma';
import { AppError } from './auth.service';
import {
  CreateAuctionInput,
  calculateMinimumBid,
  validateBidStepIncrement,
  roundToTwoDecimals,
} from '../utils/auction.validation';
import { AuctionStatus, Role } from '@prisma/client';

export class AuctionService {
  /**
   * Formats a raw Prisma Auction record into a standard JSON API response object,
   * calculating the minimum next bid required for prospective participants.
   */
  public static formatAuction(auction: any) {
    const startingBid = Number(auction.startingBid);
    const currentHighestBid = auction.currentHighestBid !== null && auction.currentHighestBid !== undefined
      ? Number(auction.currentHighestBid)
      : null;
    const minIncrement = Number(auction.minIncrement);
    const minNextBid = calculateMinimumBid(currentHighestBid, startingBid, minIncrement);

    return {
      id: auction.id,
      artworkId: auction.artworkId,
      startingBid,
      currentHighestBid,
      minIncrement,
      minNextBid,
      startTime: auction.startTime,
      endTime: auction.endTime,
      status: auction.status,
      winnerId: auction.winnerId ?? null,
      artwork: auction.artwork
        ? {
            id: auction.artwork.id,
            title: auction.artwork.title,
            description: auction.artwork.description,
            medium: auction.artwork.medium,
            imageUrl: auction.artwork.imageUrl,
            price: Number(auction.artwork.price),
            artistId: auction.artwork.artistId,
            artist: auction.artwork.artist
              ? {
                  id: auction.artwork.artist.id,
                  name: auction.artwork.artist.name,
                }
              : undefined,
          }
        : undefined,
      bids: auction.bids
        ? auction.bids.map((b: any) => ({
            id: b.id,
            auctionId: b.auctionId,
            bidderId: b.bidderId,
            amount: Number(b.amount),
            createdAt: b.createdAt,
            bidder: b.bidder
              ? {
                  id: b.bidder.id,
                  name: b.bidder.name,
                }
              : undefined,
          }))
        : undefined,
      createdAt: auction.createdAt,
      updatedAt: auction.updatedAt,
    };
  }

  /**
   * Creates and schedules a new live auction (ADMIN only).
   */
  public static async createAuction(adminId: string, input: CreateAuctionInput) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== Role.ADMIN) {
      throw new AppError('Only platform administrators are authorized to create auctions', 403);
    }

    const artwork = await prisma.artwork.findUnique({
      where: { id: input.artworkId },
    });

    if (!artwork) {
      throw new AppError('Artwork specified for auction does not exist', 404);
    }

    // Determine initial status based on start time
    const now = new Date();
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);

    let status: AuctionStatus = AuctionStatus.UPCOMING;
    if (now >= startTime && now < endTime) {
      status = AuctionStatus.ACTIVE;
    } else if (now >= endTime) {
      status = AuctionStatus.ENDED;
    }

    const auction = await prisma.auction.create({
      data: {
        artworkId: input.artworkId,
        startingBid: input.startingBid,
        minIncrement: input.minIncrement,
        startTime,
        endTime,
        status,
      },
      include: {
        artwork: {
          include: {
            artist: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return this.formatAuction(auction);
  }

  /**
   * Retrieves an auction by ID with current bids and calculated minimum next bid.
   */
  public static async getAuctionById(id: string) {
    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        artwork: {
          include: {
            artist: {
              select: { id: true, name: true },
            },
          },
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          include: {
            bidder: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!auction) {
      throw new AppError('Auction record not found', 404);
    }

    return this.formatAuction(auction);
  }

  /**
   * Validates and executes a bid placement transaction atomically.
   * Enforces:
   * 1. Auction existence and ACTIVE status
   * 2. Active time window (between startTime and endTime)
   * 3. Bidder wallet sufficiency (credits >= bidAmount)
   * 4. Strict step increment rules (>= startingBid for opening, >= highest + minIncrement for subsequent)
   */
  public static async placeBid(auctionId: string, bidderId: string, bidAmount: number) {
    const roundedBid = roundToTwoDecimals(bidAmount);

    return await prisma.$transaction(async (tx) => {
      // 1. Fetch auction with artwork details
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: {
          artwork: true,
        },
      });

      if (!auction) {
        throw new AppError('Auction record not found', 404);
      }

      // 2. Validate auction status and timing
      const now = new Date();
      if (auction.status !== AuctionStatus.ACTIVE) {
        if (auction.status === AuctionStatus.UPCOMING) {
          throw new AppError('This auction has not started yet. Bids are not accepted for upcoming auctions.', 400);
        }
        if (auction.status === AuctionStatus.ENDED || auction.status === AuctionStatus.CANCELLED) {
          throw new AppError('This auction has closed. Bids are no longer accepted.', 400);
        }
      }

      if (now < auction.startTime) {
        throw new AppError('This auction has not started yet. Bids are not accepted before the start time.', 400);
      }

      if (now > auction.endTime) {
        // Auto-mark auction as ended if past end time
        await tx.auction.update({
          where: { id: auctionId },
          data: { status: AuctionStatus.ENDED },
        });
        throw new AppError('This auction has concluded. Bids submitted after auction closure are rejected.', 400);
      }

      // 3. Artist cannot bid on their own artwork
      if (auction.artwork.artistId === bidderId) {
        throw new AppError('Artists are not permitted to bid on their own artworks in an auction.', 403);
      }

      // 4. Validate bidding step increment
      const incrementCheck = validateBidStepIncrement(
        roundedBid,
        auction.currentHighestBid ? Number(auction.currentHighestBid) : null,
        Number(auction.startingBid),
        Number(auction.minIncrement)
      );

      if (!incrementCheck.isValid) {
        throw new AppError(incrementCheck.error || 'Bid does not satisfy the required increment.', 400);
      }

      // 5. Verify bidder has sufficient internal credits
      const bidderWallet = await tx.wallet.findUnique({
        where: { userId: bidderId },
      });

      if (!bidderWallet) {
        throw new AppError('Bidder credit wallet not found', 404);
      }

      const walletBalance = Number(bidderWallet.balance);
      if (walletBalance < roundedBid) {
        throw new AppError(
          `Insufficient credit balance. You have ${walletBalance.toFixed(2)} credits, but this bid requires ${roundedBid.toFixed(2)} credits.`,
          400
        );
      }

      // 6. Record the bid
      const bid = await tx.auctionBid.create({
        data: {
          auctionId,
          bidderId,
          amount: roundedBid,
        },
        include: {
          bidder: {
            select: { id: true, name: true },
          },
        },
      });

      // 7. Update current highest bid on the auction
      const updatedAuction = await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentHighestBid: roundedBid,
        },
        include: {
          artwork: {
            include: {
              artist: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      return {
        bid: {
          id: bid.id,
          auctionId: bid.auctionId,
          bidderId: bid.bidderId,
          amount: Number(bid.amount),
          createdAt: bid.createdAt,
          bidder: bid.bidder,
        },
        auction: this.formatAuction(updatedAuction),
      };
    });
  }
}
