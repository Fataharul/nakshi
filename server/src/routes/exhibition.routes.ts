import { Router, Request, Response, NextFunction } from 'express';
import { ExhibitionController } from '../controllers/exhibition.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';
import { AuthService } from '../services/auth.service';
import { ExhibitionAnalyticsController } from '../controllers/exhibition-analytics.controller';

const router = Router();

const optionalJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = AuthService.verifyToken(token);
      req.user = payload;
    } catch {
      // Ignored for optional authentication
    }
  }
  next();
};

// Public Browse
router.get('/', ExhibitionController.getAll);

// Organizer / Admin Creation
router.post(
  '/',
  authenticateJWT,
  requireRoles(Role.ORGANIZER, Role.ADMIN),
  ExhibitionController.create
);

// Exhibition Details (optional auth to determine userTicket)
router.get('/:id', optionalJWT, ExhibitionController.getById);

// Purchase Ticket
router.post('/:id/ticket', authenticateJWT, ExhibitionController.purchaseTicket);

// Enter Exhibition Virtual Room
router.get('/:id/room', optionalJWT, ExhibitionController.getRoom);

// Exhibition visit tracking (T-081 foundation for viewing time)
router.post('/:id/visits', optionalJWT, ExhibitionAnalyticsController.startVisit);
router.post('/:id/visits/:visitId/heartbeat', optionalJWT, ExhibitionAnalyticsController.heartbeat);

// Exhibition analytics: average viewing time and ticket revenue (T-082)
router.get(
  '/:id/analytics',
  authenticateJWT,
  requireRoles(Role.ORGANIZER, Role.ADMIN),
  ExhibitionAnalyticsController.getAnalytics
);

export default router;
