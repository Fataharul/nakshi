import { Request, Response, NextFunction } from 'express';
import { ExhibitionService } from '../services/exhibition.service';

export class ExhibitionController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const organizerId = req.query.organizerId as string | undefined;
      const exhibitions = await ExhibitionService.getAll({ status, organizerId });
      res.status(200).json({ exhibitions });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const currentUserId = (req as any).user?.id;
      const exhibition = await ExhibitionService.getById(id, currentUserId);
      res.status(200).json({ exhibition });
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizerId = (req as any).user!.id;
      const exhibition = await ExhibitionService.create(organizerId, req.body);
      res.status(201).json({ exhibition });
    } catch (error) {
      next(error);
    }
  }

  public static async purchaseTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user!.id;
      const id = req.params.id as string;
      const isVip = Boolean(req.body.isVip);
      const ticket = await ExhibitionService.purchaseTicket(userId, id, isVip);
      res.status(201).json({ ticket });
    } catch (error) {
      next(error);
    }
  }

  public static async getRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const currentUserId = (req as any).user?.id;
      const ticketToken = (req.query.token as string) || (req.headers['x-ticket-token'] as string);
      const room = await ExhibitionService.getRoom(id, currentUserId, ticketToken);
      res.status(200).json(room);
    } catch (error) {
      next(error);
    }
  }
}
