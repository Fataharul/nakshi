import { describe, it, expect, vi } from 'vitest';
import { ArtworkService, AppError } from '../../src/services/artwork.service';
import { prisma } from '../../src/config/prisma';

describe('Artwork Comments Unit Tests', () => {
  it('rejects empty or whitespace-only comments with 400 Bad Request', async () => {
    await expect(ArtworkService.addComment('art-1', 'user-1', '')).rejects.toThrow(AppError);
    await expect(ArtworkService.addComment('art-1', 'user-1', '   ')).rejects.toThrow(AppError);
  });

  it('rejects comment exceeding 500 characters with 400 Bad Request', async () => {
    const longComment = 'a'.repeat(501);
    await expect(ArtworkService.addComment('art-1', 'user-1', longComment)).rejects.toThrow(AppError);
  });

  it('throws 404 when adding comment to non-existent artwork', async () => {
    vi.spyOn(prisma.artwork, 'findUnique').mockResolvedValueOnce(null);
    await expect(ArtworkService.addComment('non-existent-id', 'user-1', 'Great piece!')).rejects.toThrow(AppError);
  });

  it('successfully creates comment and returns structured response', async () => {
    vi.spyOn(prisma.artwork, 'findUnique').mockResolvedValueOnce({ id: 'art-1' } as any);
    const mockComment = {
      id: 'comment-123',
      artworkId: 'art-1',
      userId: 'user-1',
      content: 'Beautiful Jamdani weave!',
      createdAt: new Date(),
      user: {
        id: 'user-1',
        name: 'Tanvir Ahmed',
        avatarUrl: null,
        role: 'BUYER',
      },
    };
    vi.spyOn(prisma.artworkComment, 'create').mockResolvedValueOnce(mockComment as any);

    const result = await ArtworkService.addComment('art-1', 'user-1', 'Beautiful Jamdani weave!');
    expect(result.id).toBe('comment-123');
    expect(result.content).toBe('Beautiful Jamdani weave!');
    expect(result.user.name).toBe('Tanvir Ahmed');
  });
});
