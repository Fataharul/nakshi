import { Router } from 'express';
import { Role } from '@prisma/client';
import { AuctionController } from '../controllers/auction.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth.middleware';

const router = Router();

// Place a bid on an auction (Authenticated BUYER only)
router.post('/:id/bid', authenticateJWT, requireRoles(Role.BUYER), AuctionController.placeBid);

// Create an auction (ADMIN only)
router.post('/', authenticateJWT, requireRoles(Role.ADMIN), AuctionController.create);

// Get auction details and bids
router.get('/:id', AuctionController.getById);

export default router;
