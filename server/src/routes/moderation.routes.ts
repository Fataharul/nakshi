import { Router } from 'express';
import { Role } from '@prisma/client';
import { ModerationController } from '../controllers/moderation.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth.middleware';

const router = Router();

// All moderation endpoints strictly require authentication and ADMIN role
router.use(authenticateJWT, requireRoles(Role.ADMIN));

router.get('/queue', ModerationController.getQueue);
router.post('/:id/review', ModerationController.reviewItem);

export default router;
