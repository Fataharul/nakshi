import { Router } from 'express';
import { ExhibitionController } from '../controllers/exhibition.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Public discovery endpoints
router.get('/', ExhibitionController.getAll);

// Organizer routes (authenticated ORGANIZER or ADMIN)
router.get(
  '/organizer/my',
  authenticateJWT,
  requireRoles(Role.ORGANIZER, Role.ADMIN),
  ExhibitionController.getMyExhibitions
);

router.post(
  '/',
  authenticateJWT,
  requireRoles(Role.ORGANIZER, Role.ADMIN),
  ExhibitionController.create
);

// VIP Viewing Schedule Configuration
router.patch(
  '/:id/vip-schedule',
  authenticateJWT,
  requireRoles(Role.ORGANIZER, Role.ADMIN),
  ExhibitionController.configureVipSchedule
);

router.put(
  '/:id/vip-schedule',
  authenticateJWT,
  requireRoles(Role.ORGANIZER, Role.ADMIN),
  ExhibitionController.configureVipSchedule
);

// Individual exhibition details
router.get('/:id', ExhibitionController.getById);

export default router;
