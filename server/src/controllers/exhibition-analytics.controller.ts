import { Request, Response, NextFunction } from 'express';
import { ExhibitionAnalyticsService } from '../services/exhibition-analytics.service';

export class ExhibitionAnalyticsController {
  public static async startVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exhibitionId = req.params.id as string;
      const ticketToken = (req.query.token as string) || (req.headers['x-ticket-token'] as string);
      const result = await ExhibitionAnalyticsService.startVisit(exhibitionId, req.user?.id, ticketToken);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async heartbeat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exhibitionId = req.params.id as string;
      const visitId = req.params.visitId as string;
      const result = await ExhibitionAnalyticsService.heartbeat(exhibitionId, visitId, req.user?.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exhibitionId = req.params.id as string;
      const analytics = await ExhibitionAnalyticsService.getAnalytics(exhibitionId, {
        id: req.user!.id,
        role: req.user!.role,
      });
      res.status(200).json({ analytics });
    } catch (error) {
      next(error);
    }
  }
}