import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import bcrypt from 'bcrypt';
import { app } from '../../src/server';
import { prisma } from '../../src/config/prisma';
import { AuthService } from '../../src/services/auth.service';

describe('Admin Moderation Queue & Duplicate Detection Acceptance Tests (Phase 4)', () => {
  let serverInstance: http.Server;
  let baseUrl: string;
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  let adminToken: string;
  let adminId: string;
  let artistToken: string;
  let artistId: string;
  let buyerToken: string;
  let buyerId: string;

  let originalArtworkId: string;
  let duplicateArtworkId: string;
  let moderationReviewId: string;

  const testImageA = `https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&run=${uniqueId}`;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      serverInstance = app.listen(0, () => {
        const address = serverInstance.address() as AddressInfo;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });

    // 1. Retrieve or create Admin user and generate token
    let admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: `admin_${uniqueId}@nakshi.test`,
          name: 'Nakshi SuperAdmin',
          passwordHash: await bcrypt.hash('Password123!', 10),
          role: 'ADMIN',
          wallet: { create: { balance: 0.0 } },
        },
      });
    }

    adminToken = AuthService.generateToken({
      id: admin.id,
      email: admin.email,
      role: 'ADMIN',
      name: admin.name,
    });
    adminId = admin.id;

    // 2. Register Artist user
    const artistEmail = `artist_mod_${uniqueId}@nakshi.test`;
    const artistReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Heritage Weaver Rokeya',
        email: artistEmail,
        password: 'Password123!',
        role: 'ARTIST',
        bio: 'Master artisan in Nakshi Kantha embroidery.',
      }),
    });
    const artistData = (await artistReg.json()) as any;
    artistToken = artistData.token;
    artistId = artistData.user.id;

    // 3. Register Buyer user
    const buyerEmail = `buyer_mod_${uniqueId}@nakshi.test`;
    const buyerReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Art Collector Buyer',
        email: buyerEmail,
        password: 'Password123!',
        role: 'BUYER',
      }),
    });
    const buyerData = (await buyerReg.json()) as any;
    buyerToken = buyerData.token;
    buyerId = buyerData.user.id;
  });

  afterAll(async () => {
    try {
      await prisma.moderationReview.deleteMany({
        where: {
          OR: [
            { sourceArtwork: { artistId } },
            { sourceArtwork: { title: { contains: uniqueId } } },
          ],
        },
      });
      await prisma.artwork.deleteMany({
        where: {
          OR: [
            { artistId },
            { title: { contains: uniqueId } },
          ],
        },
      });
    } catch {}

    await new Promise<void>((resolve) => {
      serverInstance.close(() => resolve());
    });
  });


  describe('1. Role-Based Access Control (RBAC) on Moderation Queue', () => {
    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/moderation/queue`);
      expect(res.status).toBe(401);
    });

    it('rejects BUYER role requests with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/moderation/queue`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('rejects ARTIST role requests with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/moderation/queue`, {
        headers: { Authorization: `Bearer ${artistToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('allows ADMIN role requests with 200 OK', async () => {
      const res = await fetch(`${baseUrl}/api/moderation/queue`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(Array.isArray(data.queue)).toBe(true);
    });
  });

  describe('2. Active Perceptual Duplicate Detection & Moderation Flagging', () => {
    it('creates original artwork with status APPROVED when no duplicates exist', async () => {
      const res = await fetch(`${baseUrl}/api/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${artistToken}`,
        },
        body: JSON.stringify({
          title: `Original Tapestry ${uniqueId}`,
          description: 'A genuine original Nakshi Kantha handcrafted in rural Jamalpur.',
          medium: 'Nakshi Kantha',
          price: 350.0,
          imageUrl: testImageA,
        }),
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.artwork).toBeDefined();
      expect(data.artwork.moderationStatus).toBe('APPROVED');
      expect(data.artwork.imageHash).toBeDefined();
      originalArtworkId = data.artwork.id;
    });

    it('flags duplicate artwork upload exceeding 80% threshold and creates ModerationReview', async () => {
      // Re-upload identical image
      const res = await fetch(`${baseUrl}/api/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${artistToken}`,
        },
        body: JSON.stringify({
          title: `Suspected Copycat Tapestry ${uniqueId}`,
          description: 'A second upload using the exact same photography as the original piece.',
          medium: 'Nakshi Kantha',
          price: 290.0,
          imageUrl: testImageA,
        }),
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.artwork).toBeDefined();
      expect(data.artwork.moderationStatus).toBe('FLAGGED');
      duplicateArtworkId = data.artwork.id;

      // Verify ModerationReview in database
      const review = await prisma.moderationReview.findFirst({
        where: { sourceArtworkId: duplicateArtworkId },
      });
      expect(review).toBeDefined();
      expect(review!.suspectedMatchId).toBe(originalArtworkId);
      expect(review!.similarityScore).toBeGreaterThanOrEqual(80.0);
      expect(review!.actionTaken).toBeNull();
      moderationReviewId = review!.id;
    });

    it('excludes flagged duplicate artwork from public marketplace searches', async () => {
      const res = await fetch(`${baseUrl}/api/artworks?search=${encodeURIComponent(uniqueId)}`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;

      const titles = data.artworks.map((a: any) => a.id);
      expect(titles).toContain(originalArtworkId);
      expect(titles).not.toContain(duplicateArtworkId);
    });
  });

  describe('3. Admin Moderation Queue Retrieval & Split-Screen Comparison Data', () => {
    it('returns flagged listing in admin queue with side-by-side comparative details', async () => {
      const res = await fetch(`${baseUrl}/api/moderation/queue`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      const queueItem = data.queue.find((item: any) => item.sourceArtworkId === duplicateArtworkId);

      expect(queueItem).toBeDefined();
      expect(queueItem.similarityScore).toBeGreaterThanOrEqual(80.0);
      expect(queueItem.sourceArtwork.id).toBe(duplicateArtworkId);
      expect(queueItem.sourceArtwork.title).toContain('Suspected Copycat Tapestry');
      expect(queueItem.suspectedMatchArtwork).toBeDefined();
      expect(queueItem.suspectedMatchArtwork.id).toBe(originalArtworkId);
      expect(queueItem.suspectedMatchArtwork.title).toContain('Original Tapestry');
    });
  });

  describe('4. Administrative Approval & Override Workflow', () => {
    it('allows admin to approve flagged artwork and publish it to the marketplace', async () => {
      const res = await fetch(`${baseUrl}/api/moderation/${moderationReviewId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          action: 'APPROVE',
          notes: 'Verified artisan submitted an authentic variation of the same series.',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.actionTaken).toBe('APPROVED');
      expect(data.artwork.moderationStatus).toBe('APPROVED');

      // Verify database updated
      const updatedArtwork = await prisma.artwork.findUnique({
        where: { id: duplicateArtworkId },
      });
      expect(updatedArtwork!.moderationStatus).toBe('APPROVED');

      // Now verify public search includes the approved artwork
      const searchRes = await fetch(`${baseUrl}/api/artworks?search=${encodeURIComponent(uniqueId)}`);
      expect(searchRes.status).toBe(200);
      const searchData = (await searchRes.json()) as any;
      const ids = searchData.artworks.map((a: any) => a.id);
      expect(ids).toContain(duplicateArtworkId);
    });

    it('allows admin to reject a flagged duplicate artwork', async () => {
      // Create a 3rd duplicate to test rejection
      const createRes = await fetch(`${baseUrl}/api/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${artistToken}`,
        },
        body: JSON.stringify({
          title: `Rejected Copycat Tapestry ${uniqueId}`,
          description: 'A third upload using the same image.',
          medium: 'Nakshi Kantha',
          price: 280.0,
          imageUrl: testImageA,
        }),
      });

      expect(createRes.status).toBe(201);
      const createData = (await createRes.json()) as any;
      const rejectedArtworkId = createData.artwork.id;
      expect(createData.artwork.moderationStatus).toBe('FLAGGED');

      // Admin rejects it
      const rejectRes = await fetch(`${baseUrl}/api/moderation/${rejectedArtworkId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          action: 'REJECT',
          notes: 'Copyright violation confirmed by moderation team.',
        }),
      });

      expect(rejectRes.status).toBe(200);
      const rejectData = (await rejectRes.json()) as any;
      expect(rejectData.actionTaken).toBe('REJECTED');

      // Verify rejected artwork is NOT in public search
      const searchRes = await fetch(`${baseUrl}/api/artworks?search=${encodeURIComponent(uniqueId)}`);
      const searchData = (await searchRes.json()) as any;
      const ids = searchData.artworks.map((a: any) => a.id);
      expect(ids).not.toContain(rejectedArtworkId);
    });
  });
});
