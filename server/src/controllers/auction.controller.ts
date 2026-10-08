import { Request, Response, NextFunction } from 'express';
import { AuctionService } from '../services/auction.service';
import { createAuctionSchema, placeBidSchema } from '../utils/auction.validation';
import { AppError } from '../services/auth.service';
import { prisma } from '../config/prisma';

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
    /**
   * GET /api/auctions/active
   */
  public static async getActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auctions = await AuctionService.getActiveAuctions();
      res.status(200).json({ auctions });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auctions/:id
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auction = await AuctionService.getAuctionById(req.params.id as string);
      res.status(200).json({ auction });
    } catch (error) {
      next(error);
    }
  }

  /**
   * T-049: POST /api/auctions/:id/bids
   */
  public static async placeBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auctionId = req.params.id as string;
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(auctionId)) {
        throw new AppError('Invalid auction ID', 400);
      }

      const validatedData = placeBidSchema.parse(req.body);
      const bidderId = req.user!.id;

      const result = await AuctionService.placeBid(bidderId, auctionId, validatedData);
      res.status(201).json({
        message: 'Bid submitted successfully',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
