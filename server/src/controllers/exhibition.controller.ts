import { Request, Response, NextFunction } from 'express';
import { ExhibitionService } from '../services/exhibition.service';
import {
  createExhibitionSchema,
  configureVipScheduleSchema,
  purchaseTicketSchema,
  enterExhibitionSchema,
} from '../utils/exhibition.validation';

export class ExhibitionController {
  /**
   * Create a new exhibition (ORGANIZER or ADMIN).
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createExhibitionSchema.parse(req.body);
      const organizerId = req.user!.id;
      const exhibition = await ExhibitionService.createExhibition(organizerId, validatedData);
      res.status(201).json({ exhibition });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all public exhibitions.
   */
  public static async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exhibitions = await ExhibitionService.getExhibitions();
      res.status(200).json({ exhibitions });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get exhibition by ID.
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const exhibition = await ExhibitionService.getExhibitionById(id);
      res.status(200).json({ exhibition });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get exhibitions curated by the authenticated organizer.
   */
  public static async getMyExhibitions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizerId = req.user!.id;
      const exhibitions = await ExhibitionService.getOrganizerExhibitions(organizerId);
      res.status(200).json({ exhibitions });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Configure or update VIP viewing schedule for an exhibition.
   */
  public static async configureVipSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const validatedData = configureVipScheduleSchema.parse(req.body);
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const exhibition = await ExhibitionService.updateVipSchedule(
        id,
        userId,
        userRole,
        validatedData
      );

      res.status(200).json({
        exhibition,
        message: 'VIP viewing schedule updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Purchase an admission ticket or VIP pass for an exhibition.
   */
  public static async buyTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exhibitionId = req.params.id as string;
      const validatedData = purchaseTicketSchema.parse(req.body || {});
      const buyerId = req.user!.id;

      const ticket = await ExhibitionService.purchaseTicket(
        exhibitionId,
        buyerId,
        validatedData.isVip
      );

      res.status(201).json({
        ticket,
        message: `${validatedData.isVip ? 'VIP Access Pass' : 'Admission Ticket'} purchased successfully.`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get authenticated user's ticket for this exhibition.
   */
  public static async getMyTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exhibitionId = req.params.id as string;
      const userId = req.user!.id;

      const ticket = await ExhibitionService.getMyTicket(exhibitionId, userId);
      res.status(200).json({ ticket });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enter the virtual exhibition gallery with timestamp-based VIP access gating.
   */
  public static async enter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exhibitionId = req.params.id as string;
      const validatedData = enterExhibitionSchema.parse(req.body || {});
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const accessResult = await ExhibitionService.enterExhibition(
        exhibitionId,
        userId,
        userRole,
        {
          ticketToken: validatedData.ticketToken || (req.query.ticketToken as string | undefined),
          simulatedTime: validatedData.simulatedTime || (req.query.simulatedTime as string | undefined),
        }
      );

      res.status(200).json(accessResult);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get exhibition analytics and curatorial performance report (creator ORGANIZER or ADMIN).
   */
  public static async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exhibitionId = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const analytics = await ExhibitionService.getExhibitionAnalytics(
        exhibitionId,
        userId,
        userRole
      );

      res.status(200).json({ analytics });
    } catch (error) {
      next(error);
    }
  }
}

