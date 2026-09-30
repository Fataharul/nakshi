import { Request, Response, NextFunction } from 'express';
import { ArtworkService } from '../services/artwork.service';
import { StorageService } from '../services/storage.service';
import { createArtworkSchema, updateArtworkSchema, artworkQuerySchema } from '../utils/artwork.validation';

export class ArtworkController {
  public static async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const artistId = req.user!.id;
      if (!req.file) {
        res.status(400).json({ error: 'No image file provided for upload' });
        return;
      }
      const result = await StorageService.uploadArtworkImage(req.file, artistId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createArtworkSchema.parse(req.body);
      const artistId = req.user!.id;
      const artwork = await ArtworkService.createArtwork(artistId, validatedData);
      res.status(201).json({ artwork });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const validatedData = updateArtworkSchema.parse(req.body);
      const artistId = req.user!.id;
      const artwork = await ArtworkService.updateArtwork(id, artistId, validatedData);
      res.status(200).json({ artwork });
    } catch (error) {
      next(error);
    }
  }

  public static async getMyArtworks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const artistId = req.user!.id;
      const artworks = await ArtworkService.getArtistArtworks(artistId);
      res.status(200).json({ artworks });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const artwork = await ArtworkService.getArtworkById(id);
      res.status(200).json({ artwork });
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = artworkQuerySchema.parse(req.query);
      const result = await ArtworkService.getArtworks(validatedQuery);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async getStorefront(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const artistId = req.params.artistId as string;
      const storefront = await ArtworkService.getArtistStorefront(artistId);
      res.status(200).json(storefront);
    } catch (error) {
      next(error);
    }
  }
}

