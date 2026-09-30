import { Request, Response, NextFunction } from 'express';
import { SellerService, AppError } from '../services/seller.service';

export const getSellerMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const metricsData = await SellerService.getSellerMetrics(req.user.id);
    res.status(200).json(metricsData);
  } catch (err: any) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
};
