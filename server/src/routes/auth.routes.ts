import { Router } from 'express';
import { Role } from '@prisma/client';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Protected user routes
router.get('/me', authenticateJWT, AuthController.getMe);
router.patch('/profile', authenticateJWT, AuthController.updateProfile);

// Protected RBAC verification route (accessible only by ADMIN)
router.get('/admin-test', authenticateJWT, requireRoles(Role.ADMIN), AuthController.adminTest);

export default router;
