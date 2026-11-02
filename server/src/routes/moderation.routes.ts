import { Router } from 'express';
import { Role } from '@prisma/client';
import { ModerationController } from '../controllers/moderation.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth.middleware';

const router = Router();

// All moderation endpoints strictly require authentication and ADMIN role
router.use(authenticateJWT, requireRoles(Role.ADMIN));

router.get('/queue', ModerationController.getQueue);
router.get('/history', ModerationController.getHistory);
router.get('/stats', ModerationController.getStats);
router.post('/:id/review', ModerationController.reviewItem);
router.post('/:id/flag', ModerationController.flagListing);

export default router;

