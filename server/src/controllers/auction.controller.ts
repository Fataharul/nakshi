import { Request, Response, NextFunction } from 'express';
import { AuctionService } from '../services/auction.service';
import { createAuctionSchema, placeBidSchema } from '../utils/auction.validation';
import { AppError } from '../services/auth.service';
import { prisma } from '../config/prisma';

export class AuctionController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createAuctionSchema.parse(req.body);
      const adminId = req.user!.id;
      const auction = await AuctionService.createAuction(adminId, validatedData);
      res.status(201).json({ auction });
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const auctions = await AuctionService.getAll(status);
      res.status(200).json({ auctions });
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

  public static async placeBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auctionId = req.params.id as string;
      const validatedData = placeBidSchema.parse(req.body);
      const userId = req.user!.id;

      const { bid, currentHighestBid } = await AuctionService.placeBid(userId, auctionId, validatedData);
      res.status(201).json({ bid, currentHighestBid });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const auctionId = req.params.id as string;
      const auction = await AuctionService.getById(auctionId);
      res.status(200).json({ auction });
    } catch (error) {
      next(error);
    }
  }
}
