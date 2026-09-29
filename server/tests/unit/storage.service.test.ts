import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageService, AppError } from '../../src/services/storage.service';
import fs from 'fs';
import path from 'path';

describe('StorageService Unit Tests', () => {
  const dummyArtistId = 'artist_test_123';
  const dummyBuffer = Buffer.from('fake-image-content-for-testing');

  describe('validateImageFile', () => {
    it('accepts valid PNG, JPEG, and WEBP image files within 5MB', () => {
      const validPng: any = {
        mimetype: 'image/png',
        size: 1024 * 1024, // 1MB
      };
      const validJpeg: any = {
        mimetype: 'image/jpeg',
        size: 2 * 1024 * 1024, // 2MB
      };
      const validWebp: any = {
        mimetype: 'image/webp',
        size: 500 * 1024, // 500KB
      };

      expect(() => StorageService.validateImageFile(validPng)).not.toThrow();
      expect(() => StorageService.validateImageFile(validJpeg)).not.toThrow();
      expect(() => StorageService.validateImageFile(validWebp)).not.toThrow();
    });

    it('rejects missing file with 400 status', () => {
      expect(() => StorageService.validateImageFile(null as any)).toThrowError(AppError);
      try {
        StorageService.validateImageFile(null as any);
      } catch (err: any) {
        expect(err.statusCode).toBe(400);
        expect(err.message).toContain('No image file provided');
      }
    });

    it('rejects unsupported MIME types (e.g. text/plain, application/pdf, image/gif)', () => {
      const unsupportedFiles: any[] = [
        { mimetype: 'text/plain', size: 1024 },
        { mimetype: 'application/pdf', size: 1024 },
        { mimetype: 'image/gif', size: 1024 },
      ];

      for (const file of unsupportedFiles) {
        expect(() => StorageService.validateImageFile(file)).toThrowError(AppError);
        try {
          StorageService.validateImageFile(file);
        } catch (err: any) {
          expect(err.statusCode).toBe(400);
          expect(err.message).toContain('Unsupported file type');
        }
      }
    });

    it('rejects files larger than 5MB', () => {
      const largeFile: any = {
        mimetype: 'image/png',
        size: 5 * 1024 * 1024 + 1, // 5MB + 1 byte
      };

      expect(() => StorageService.validateImageFile(largeFile)).toThrowError(AppError);
      try {
        StorageService.validateImageFile(largeFile);
      } catch (err: any) {
        expect(err.statusCode).toBe(400);
        expect(err.message).toContain('exceeds the maximum allowed size');
      }
    });
  });

  describe('uploadArtworkImage', () => {
    const testUploadDir = path.resolve('./uploads/artworks', dummyArtistId);

    afterEach(() => {
      if (fs.existsSync(testUploadDir)) {
        fs.rmSync(testUploadDir, { recursive: true, force: true });
      }
    });

    it('successfully handles file upload in test mode with local fallback', async () => {
      const mockFile: any = {
        fieldname: 'image',
        originalname: 'nakshi-kantha.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: dummyBuffer,
        size: dummyBuffer.length,
      };

      const result = await StorageService.uploadArtworkImage(mockFile, dummyArtistId);

      expect(result).toBeDefined();
      expect(result.imageUrl).toMatch(/^\/uploads\/artworks\/artist_test_123\/.*\.png$/);
      expect(result.key).toMatch(/^artworks\/artist_test_123\/.*\.png$/);

      // Verify file was written to disk
      expect(fs.existsSync(testUploadDir)).toBe(true);
      const files = fs.readdirSync(testUploadDir);
      expect(files.length).toBe(1);
      expect(files[0].endsWith('.png')).toBe(true);
    });

    it('generates correct extension for jpeg and webp files', async () => {
      const jpegFile: any = {
        fieldname: 'image',
        originalname: 'pottery.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: dummyBuffer,
        size: dummyBuffer.length,
      };

      const webpFile: any = {
        fieldname: 'image',
        originalname: 'jamdani.webp',
        encoding: '7bit',
        mimetype: 'image/webp',
        buffer: dummyBuffer,
        size: dummyBuffer.length,
      };

      const jpegResult = await StorageService.uploadArtworkImage(jpegFile, dummyArtistId);
      expect(jpegResult.key.endsWith('.jpg')).toBe(true);

      const webpResult = await StorageService.uploadArtworkImage(webpFile, dummyArtistId);
      expect(webpResult.key.endsWith('.webp')).toBe(true);
    });
  });
});
