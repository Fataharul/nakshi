import { Router } from 'express';
import { Role } from '@prisma/client';
import { ArtworkController } from '../controllers/artwork.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth.middleware';
import { uploadSingleImage } from '../middleware/upload.middleware';

const router = Router();

// Protected creator routes (require authentication + ARTIST, ORGANIZER, or ADMIN role)
router.post('/upload', authenticateJWT, requireRoles(Role.ARTIST, Role.ORGANIZER, Role.ADMIN), uploadSingleImage.single('image'), ArtworkController.uploadImage);
router.post('/', authenticateJWT, requireRoles(Role.ARTIST, Role.ORGANIZER, Role.ADMIN), ArtworkController.create);
router.put('/:id', authenticateJWT, requireRoles(Role.ARTIST, Role.ORGANIZER, Role.ADMIN), ArtworkController.update);
router.patch('/:id', authenticateJWT, requireRoles(Role.ARTIST, Role.ORGANIZER, Role.ADMIN), ArtworkController.update);
router.delete('/:id', authenticateJWT, requireRoles(Role.ARTIST, Role.ORGANIZER, Role.ADMIN), ArtworkController.delete);
router.get('/my-artworks', authenticateJWT, requireRoles(Role.ARTIST, Role.ORGANIZER, Role.ADMIN), ArtworkController.getMyArtworks);

// Public / general artwork routes
router.get('/', ArtworkController.getAll);
router.get('/storefront/:artistId', ArtworkController.getStorefront);
router.get('/:id', ArtworkController.getById);
router.post('/:id/like', ArtworkController.likeArtwork);
router.get('/:id/comments', ArtworkController.getComments);
router.post('/:id/comments', authenticateJWT, ArtworkController.addComment);

export default router;
