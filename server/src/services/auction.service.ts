import { prisma } from '../config/prisma';
import { AppError } from './auth.service';
import {
  CreateAuctionInput,
  PlaceBidInput,
  isAuctionOpenForBidding,
  getMinimumAcceptableBid,
} from '../utils/auction.validation';
import { AuctionStatus, ArtworkAvailability, TransactionType } from '@prisma/client';
import { io } from '../server';

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

  public static async placeBid(userId: string, auctionId: string, data: PlaceBidInput) {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        artwork: true,
        bids: {
          orderBy: { amount: 'desc' },
          take: 1
        }
      }
    });

    if (!auction) {
      throw new AppError('Auction not found', 404);
    }

    if (auction.status !== AuctionStatus.ACTIVE) {
      throw new AppError(`Cannot bid on auction. Current status: ${auction.status}`, 400);
    }

    if (auction.artwork.artistId === userId) {
      throw new AppError('You cannot bid on your own artwork', 400);
    }

    // Bid validation
    const bidAmount = Number(data.amount);
    const startingBid = Number(auction.startingBid);
    const minIncrement = Number(auction.minIncrement);
    const currentHighest = auction.currentHighestBid ? Number(auction.currentHighestBid) : null;

    if (bidAmount < startingBid) {
      throw new AppError(`Bid must be at least the starting bid of ${startingBid}`, 400);
    }

    if (currentHighest !== null && bidAmount < currentHighest + minIncrement) {
      throw new AppError(`Bid must be at least ${currentHighest + minIncrement} (current highest + increment)`, 400);
    }

    const previousHighestBid = auction.bids.length > 0 ? auction.bids[0] : null;

    // Transaction to handle the bid, deductions, and refunds
    const newBid = await prisma.$transaction(async (tx) => {
      // 1. Verify and hold funds from the new bidder
      const wallet = await tx.wallet.findUnique({
        where: { userId: userId },
      });

      if (!wallet || Number(wallet.balance) < bidAmount) {
        throw new AppError('Insufficient credits to place this bid', 400);
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: bidAmount } }
      });

      await tx.creditTransaction.create({
        data: {
          walletId: wallet.id,
          amount: bidAmount,
          type: TransactionType.AUCTION_BID_HOLD,
          description: `Bid hold for auction ${auctionId}`,
          referenceId: auctionId
        }
      });

      // 2. Refund the previous highest bidder if they exist
      if (previousHighestBid) {
        const prevWallet = await tx.wallet.findUnique({
          where: { userId: previousHighestBid.bidderId }
        });

        if (prevWallet) {
          await tx.wallet.update({
            where: { id: prevWallet.id },
            data: { balance: { increment: previousHighestBid.amount } }
          });

          await tx.creditTransaction.create({
            data: {
              walletId: prevWallet.id,
              amount: previousHighestBid.amount,
              type: TransactionType.AUCTION_BID_REFUND,
              description: `Refund for outbid on auction ${auctionId}`,
              referenceId: auctionId
            }
          });
        }
      }

      // 3. Create the new bid record
      const bid = await tx.auctionBid.create({
        data: {
          auctionId,
          bidderId: userId,
          amount: bidAmount
        }
      });

      // 4. Update the auction's highest bid
      const updatedAuction = await tx.auction.update({
        where: { id: auctionId },
        data: { currentHighestBid: bidAmount }
      });

      return { bid, currentHighestBid: Number(updatedAuction.currentHighestBid) };
    });

    // 5. Emit Real-time events
    try {
      io.to(`auction:${auctionId}`).emit('auction:new_bid', {
        auctionId,
        bidderId: userId,
        amount: bidAmount,
        timestamp: newBid.bid.createdAt
      });

      if (previousHighestBid) {
        io.to(`user:${previousHighestBid.bidderId}`).emit('auction:outbid', {
          auctionId,
          artworkTitle: auction.artwork.title,
          newHighestBid: bidAmount
        });
      }
    } catch (err) {
      console.error('Socket emission failed', err);
    }

    return newBid;
  }

  static async getById(auctionId: string) {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        artwork: {
          select: {
            id: true,
            title: true,
            medium: true,
            imageUrl: true,
            artist: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        bids: {
          orderBy: { amount: 'desc' },
          take: 10,
          include: {
            bidder: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!auction) {
      throw new AppError('Auction not found', 404);
    }

    return auction;
  }

  static async processEndedAuctions() {
    const now = new Date();
    
    // Find all ACTIVE auctions that have passed their endTime
    const endedAuctions = await prisma.auction.findMany({
      where: {
        status: AuctionStatus.ACTIVE,
        endTime: { lte: now }
      },
      include: {
        artwork: true,
        bids: {
          orderBy: { amount: 'desc' },
          take: 1
        }
      }
    });

    for (const auction of endedAuctions) {
      await prisma.$transaction(async (tx) => {
        const highestBid = auction.bids[0];

        // 1. Mark auction as CLOSED
        await tx.auction.update({
          where: { id: auction.id },
          data: { 
            status: AuctionStatus.CLOSED,
            winnerId: highestBid ? highestBid.bidderId : null
          }
        });

        if (highestBid) {
          // 2. Someone won. Mark artwork as SOLD.
          await tx.artwork.update({
            where: { id: auction.artworkId },
            data: { availability: ArtworkAvailability.SOLD }
          });

          // 3. Transfer the escrowed bid amount to the artist's wallet
          const artistId = auction.artwork.artistId;
          const artistWallet = await tx.wallet.findUnique({ where: { userId: artistId } });
          
          if (artistWallet) {
            await tx.wallet.update({
              where: { id: artistWallet.id },
              data: { balance: { increment: highestBid.amount } }
            });

            await tx.creditTransaction.create({
              data: {
                walletId: artistWallet.id,
                amount: highestBid.amount,
                type: 'AUCTION_WIN_PAYOUT',
                description: `Revenue from auction ${auction.id}`,
                referenceId: auction.id
              }
            });
          }
        } else {
          // 4. No one bid. Return artwork to AVAILABLE.
          await tx.artwork.update({
            where: { id: auction.artworkId },
            data: { availability: ArtworkAvailability.AVAILABLE }
          });
        }
      });

      // 5. Emit event
      io.to(`auction:${auction.id}`).emit('auction:ended', {
        auctionId: auction.id,
        winnerId: auction.bids[0]?.bidderId || null,
        finalBid: auction.bids[0]?.amount || 0
      });
    }
  }
}
