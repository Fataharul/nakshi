import { Request, Response, NextFunction } from 'express';
import { WalletService } from '../services/wallet.service';
import { topUpSchema, transactionQuerySchema } from '../utils/wallet.validation';

export class WalletController {
  public static async topUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = topUpSchema.parse(req.body);
      const userId = req.user!.id;
      const result = await WalletService.topUp(userId, validatedData.amount);
      res.status(200).json({
        message: 'Credits topped up successfully',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await WalletService.getBalance(userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = transactionQuerySchema.parse(req.query);
      const userId = req.user!.id;
      const result = await WalletService.getTransactions(
        userId,
        validatedQuery.page,
        validatedQuery.limit
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
