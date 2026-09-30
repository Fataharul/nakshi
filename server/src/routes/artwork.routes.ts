import { Router } from 'express';
import { Role } from '@prisma/client';
import { ArtworkController } from '../controllers/artwork.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth.middleware';
import { uploadSingleImage } from '../middleware/upload.middleware';

const router = Router();

// Protected Artist routes (require authentication + ARTIST role)
router.post('/upload', authenticateJWT, requireRoles(Role.ARTIST), uploadSingleImage.single('image'), ArtworkController.uploadImage);
router.post('/', authenticateJWT, requireRoles(Role.ARTIST), ArtworkController.create);
router.put('/:id', authenticateJWT, requireRoles(Role.ARTIST), ArtworkController.update);
router.patch('/:id', authenticateJWT, requireRoles(Role.ARTIST), ArtworkController.update);
router.get('/my-artworks', authenticateJWT, requireRoles(Role.ARTIST), ArtworkController.getMyArtworks);

// Public / general artwork routes
router.get('/storefront/:artistId', ArtworkController.getStorefront);
router.get('/:id', ArtworkController.getById);

export default router;
