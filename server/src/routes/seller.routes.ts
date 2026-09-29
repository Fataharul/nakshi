import { Router } from 'express';
import { getSellerMetrics } from '../controllers/seller.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/seller/metrics
router.get('/metrics', authenticateJWT, requireRoles(Role.ARTIST, Role.ADMIN), getSellerMetrics);

export default router;
