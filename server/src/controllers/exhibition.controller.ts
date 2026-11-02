import { Request, Response, NextFunction } from 'express';
import { ExhibitionService } from '../services/exhibition.service';
import {
  createExhibitionSchema,
  configureVipScheduleSchema,
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
}
