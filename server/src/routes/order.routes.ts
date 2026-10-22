import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// All order endpoints require authentication
router.use(authenticateJWT);

router.post('/checkout', requireRoles(Role.BUYER, Role.ADMIN), OrderController.checkout);
router.get('/my-orders', requireRoles(Role.BUYER, Role.ADMIN), OrderController.getMyOrders);
router.get('/:id', OrderController.getOrderById);

export default router;
