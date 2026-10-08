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
    /**
   * AuctionBid record ke JSON e convert kore (shudhu bidder er nam dekhay)
   */
  private static formatBid(bid: any) {
    return {
      id: bid.id,
      auctionId: bid.auctionId,
      bidderId: bid.bidderId,
      bidderName: bid.bidder ? bid.bidder.name : undefined,
      amount: Number(bid.amount),
      createdAt: bid.createdAt,
    };
  }

  /**
   * Public: ACTIVE + UPCOMING auction list
   */
  public static async getActiveAuctions() {
    const now = new Date();
    const auctions = await prisma.auction.findMany({
      where: {
        status: { in: [AuctionStatus.ACTIVE, AuctionStatus.UPCOMING] },
        endTime: { gt: now },
      },
      include: {
        artwork: { include: { artist: true } },
        bids: { orderBy: { amount: 'desc' }, take: 1 },
        _count: { select: { bids: true } },
      },
      orderBy: { endTime: 'asc' },
    });

    return auctions.map((a: any) => ({
      ...this.formatAuction(a),
      currentHighestBid: this.resolveHighestBid(
        a.currentHighestBid,
        a.bids && a.bids.length > 0 ? Number(a.bids[0].amount) : null
      ),
      bidCount: a._count?.bids ?? 0,
    }));
  }

  /**
   * Public: ekta auction + recent bids
   */
  public static async getAuctionById(auctionId: string) {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        artwork: { include: { artist: true } },
        bids: {
          include: { bidder: true },
          orderBy: [{ amount: 'desc' }, { createdAt: 'asc' }],
          take: 20,
        },
        _count: { select: { bids: true } },
      },
    });

    if (!auction) {
      throw new AppError('Auction not found', 404);
    }

    const highestBid = auction.bids.length > 0 ? Number(auction.bids[0].amount) : null;

    return {
      ...this.formatAuction(auction),
      currentHighestBid: this.resolveHighestBid(auction.currentHighestBid, highestBid),
      bidCount: (auction as any)._count?.bids ?? auction.bids.length,
      bids: auction.bids.map((b: any) => this.formatBid(b)),
    };
  }

  /**
   * Highest bid = stored currentHighestBid ar AuctionBid table er max, duitar moddhe boro ta
   */
  private static resolveHighestBid(stored: any, fromBids: number | null): number | null {
    const storedNum = stored !== null && stored !== undefined ? Number(stored) : null;
    if (storedNum === null) return fromBids;
    if (fromBids === null) return storedNum;
    return Math.max(storedNum, fromBids);
  }

  /**
   * T-049: Bid submission.
   * Shob check ekta transaction e hoy, auction row lock kora thake (concurrency safe).
   */
  public static async placeBid(bidderId: string, auctionId: string, data: PlaceBidInput) {
    const amount = Number(data.amount);

    const result = await prisma.$transaction(async (tx) => {
      // Auction row lock (eki shathe duijon bid dileo vul hobe na)
      await tx.$queryRaw`SELECT id FROM "Auction" WHERE id = ${auctionId} FOR UPDATE`;

      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: { artwork: true },
      });

      if (!auction) {
        throw new AppError('Auction not found', 404);
      }

      const now = new Date();
      if (!isAuctionOpenForBidding(auction, now)) {
        if (auction.status === AuctionStatus.CANCELLED) {
          throw new AppError('This auction has been cancelled', 400);
        }
        if (now < new Date(auction.startTime)) {
          throw new AppError('This auction has not started yet', 400);
        }
        throw new AppError('This auction has ended. Bids are no longer accepted', 400);
      }

      // UPCOMING auction er start time par hole ACTIVE kore dei
      if (auction.status === AuctionStatus.UPCOMING) {
        await tx.auction.update({
          where: { id: auctionId },
          data: { status: AuctionStatus.ACTIVE },
        });
      }

      if (auction.artwork && auction.artwork.artistId === bidderId) {
        throw new AppError('You cannot bid on your own artwork', 403);
      }

      const topBid = await tx.auctionBid.findFirst({
        where: { auctionId },
        orderBy: { amount: 'desc' },
      });
      const currentHighest = this.resolveHighestBid(
        auction.currentHighestBid,
        topBid ? Number(topBid.amount) : null
      );

      const minimum = getMinimumAcceptableBid(Number(auction.startingBid), currentHighest);
      if (minimum.inclusive && amount < minimum.amount) {
        throw new AppError(
          `Bid must be at least the starting bid of ${minimum.amount.toFixed(2)} credits`,
          400
        );
      }
      if (!minimum.inclusive && amount <= minimum.amount) {
        throw new AppError(
          `Bid must be higher than the current highest bid of ${minimum.amount.toFixed(2)} credits`,
          400
        );
      }

      // T-050 (bidding step increment validation) plugs in here.

      // Wallet balance check
      const wallet = await tx.wallet.findUnique({ where: { userId: bidderId } });
      const balance = wallet ? Number(wallet.balance) : 0;
      if (balance < amount) {
        throw new AppError(
          `Insufficient credits. Your balance is ${balance.toFixed(2)} credits`,
          400
        );
      }

      const bid = await tx.auctionBid.create({
        data: { auctionId, bidderId, amount },
        include: { bidder: true },
      });

      // T-051 (update currentHighestBid) and T-054 (WebSocket broadcast) plug in here.

      return { bid, auction, previousHighest: currentHighest };
    });

    return {
      bid: this.formatBid(result.bid),
      auction: {
        id: result.auction.id,
        status: AuctionStatus.ACTIVE,
        startingBid: Number(result.auction.startingBid),
        minIncrement: Number(result.auction.minIncrement),
        endTime: result.auction.endTime,
        highestBid: Math.max(result.previousHighest ?? 0, Number(result.bid.amount)),
      },
    };
  }
}
