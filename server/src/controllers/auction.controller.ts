import { Request, Response, NextFunction } from 'express';
import { AuctionService } from '../services/auction.service';
import { createAuctionSchema, submitBidSchema } from '../utils/auction.validation';
import { AppError } from '../services/auth.service';
import { prisma } from '../config/prisma';
import { io } from '../server';
import { broadcastAuctionUpdate, sendOutbidNotification } from '../sockets/auction.socket';

export class AuctionController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createAuctionSchema.parse(req.body);
      const artistId = req.user!.id;
      
      // Ensure the artist is verified before allowing them to create an auction
      const user = await prisma.user.findUnique({ where: { id: artistId } });
      if (!user?.isVerified) {
        throw new AppError('Only verified artists can create auctions', 403);
      }

      const auction = await AuctionService.createAuction(artistId, validatedData);
      res.status(201).json({ auction });
    } catch (error) {
      next(error);
    }
  }

  public static async getMyAuctions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const artistId = req.user!.id;
      const auctions = await AuctionService.getMyAuctions(artistId);
      res.status(200).json({ auctions });
    } catch (error) {
      next(error);
    }
  }

  public static async submitBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auctionId = req.params.id as string;
      const validatedData = submitBidSchema.parse(req.body);
      const bidderId = req.user!.id;

      const result = await AuctionService.submitBid(auctionId, bidderId, validatedData);

      // 1. Broadcast updated auction state event to all connected viewers in the room
      const broadcastPayload = {
        auctionId: result.auction.id,
        currentHighestBid: result.bid.amount,
        highestBidder: result.highestBidder,
        bidId: result.bid.id,
        timestamp: result.bid.createdAt instanceof Date ? result.bid.createdAt.toISOString() : new Date(result.bid.createdAt).toISOString(),
      };

      broadcastAuctionUpdate(io, broadcastPayload);

      // 2. Broadcast targeted outbid notification to displaced previous bidder if applicable (T-062)
      if (result.outbidNotification) {
        sendOutbidNotification(io, result.outbidNotification);
      }

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}



