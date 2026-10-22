import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ModerationService } from '../services/moderation.service';

const reviewBodySchema = z.object({
  action: z.enum(['APPROVE', 'APPROVED', 'REJECT', 'REJECTED']),
  notes: z.string().max(1000).optional(),
});

export class ModerationController {
  /**
   * GET /api/moderation/queue
   * Retrieves all flagged artworks pending administrator review.
   */
  public static async getQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queue = await ModerationService.getQueue();
      res.status(200).json({ queue, total: queue.length });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/moderation/:id/review
   * Approves or rejects a flagged artwork listing.
   */
  public static async reviewItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const validatedData = reviewBodySchema.parse(req.body);
      const adminId = req.user!.id;

      const result = await ModerationService.reviewItem(id, adminId, validatedData);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
