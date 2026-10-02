import { Request, Response, NextFunction } from 'express';
import { AuctionService } from '../services/auction.service';
import { createAuctionSchema } from '../utils/auction.validation';
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
}
