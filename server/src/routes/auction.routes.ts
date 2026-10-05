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

// Bidder routes for submitting bids on active auctions
router.post(
  '/:id/bids',
  authenticateJWT,
  AuctionController.submitBid
);

export default router;

