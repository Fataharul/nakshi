import { Router } from 'express';
import { AuctionController } from '../controllers/auction.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Seller/Artist routes for monitoring auctions associated with their artwork
router.get(
  '/my',
  authenticateJWT,
  requireRoles(Role.ARTIST, Role.ADMIN),
  AuctionController.getMyAuctions
);

// Public routes for browsing auctions
router.get('/', AuctionController.getAll);
router.get('/:id', AuctionController.getById);

// Admin routes for creating and scheduling auctions
router.post(
  '/',
  authenticateJWT,
  requireRoles(Role.ADMIN),
  AuctionController.create
);

// Bidding route (authenticated users can bid)
router.post(
  '/:id/bid',
  authenticateJWT,
  AuctionController.placeBid
);

export default router;
