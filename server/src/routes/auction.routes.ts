import { Router } from 'express';
import { AuctionController } from '../controllers/auction.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Artist routes for managing their own auctions
router.post(
  '/',
  authenticateJWT,
  requireRoles(Role.ARTIST),
  AuctionController.create
);

router.get(
  '/my',
  authenticateJWT,
  requireRoles(Role.ARTIST),
  AuctionController.getMyAuctions
);

// Bidding route (authenticated users can bid)
router.post(
  '/:id/bid',
  authenticateJWT,
  AuctionController.placeBid
);

export default router;
