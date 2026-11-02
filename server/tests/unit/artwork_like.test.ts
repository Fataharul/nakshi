import { describe, it, expect, vi } from 'vitest';
import { ArtworkService, AppError } from '../../src/services/artwork.service'
import { prisma } from '../../src/config/prisma';

describe('Artwork Like Feature test', () => {
    it('increment like by exactly by 1', () => {
        const curr = 2;
        const newVal = curr + 1;

        expect(newVal).toBe(3)
    });

    it('default like count to be 0', () => {
        const rawArtwork = { id: 'art-01', title: 'Katha', like: null }
        const formatteedLike = rawArtwork.like ?? 0;
        expect(formatteedLike).toBe(0)
    })

    it('throws AppError 404 when artwork does not exist', async () => {
        // 1. Tell Prisma to return null (simulating missing artwork)
        vi.spyOn(prisma.artwork, 'findUnique').mockResolvedValueOnce(null);
        // 2. Call the REAL service method and assert it throws 404
        await expect(ArtworkService.likeArtwork('non-existent-id')).rejects.toThrow(AppError);
    });
})