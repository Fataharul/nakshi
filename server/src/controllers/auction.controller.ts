import { Request, Response, NextFunction } from 'express';
import { AuctionService } from '../services/auction.service';
import { placeBidSchema, createAuctionSchema } from '../utils/auction.validation';

export class AuctionController {
  /**
   * Places a bid on an active auction, enforcing step increment rules and credit checks.
   */
  public static async placeBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auctionId = req.params.id as string;
      const bidderId = req.user!.id;
      const { amount } = placeBidSchema.parse(req.body);

      const result = await AuctionService.placeBid(auctionId, bidderId, amount);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves auction details including current highest bid, bids history, and calculated minNextBid.
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const auction = await AuctionService.getAuctionById(id);
      res.status(200).json({ auction });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a new auction (ADMIN only).
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const validatedData = createAuctionSchema.parse(req.body);
      const auction = await AuctionService.createAuction(adminId, validatedData);
      res.status(201).json({ auction });
    } catch (error) {
      next(error);
    }
  }
}
