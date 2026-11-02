import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import bcrypt from 'bcrypt';
import { app } from '../../src/server';
import { prisma } from '../../src/config/prisma';
import { AuthService } from '../../src/services/auth.service';
import { calculateSimilarityScore, evaluateSimilarity } from '../../src/utils/similarity.util';

describe('Threshold Handling, Listing Visibility, and Queue Routing Acceptance Tests', () => {
  let serverInstance: http.Server;
  let baseUrl: string;
  const uniqueId = `tvq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  let adminToken: string;
  let adminId: string;
  let artistToken: string;
  let artistId: string;
  let buyerToken: string;
  let buyerId: string;

  let baselineArtworkId: string;
  let flaggedDuplicateId: string;
  let distinctApprovedId: string;
  let moderationReviewId: string;

  const baselineImage = `https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&base=${uniqueId}`;
  // 64-bit dHash strings for precise boundary verification
  const hashBase = '0000000000000000';
  // 32 bits different = 50.0% similarity (<= 80%)
  const hashBelowThreshold = '00000000ffffffff';
  // 4 bits different = 60/64 = 93.75% similarity (> 80%)
  const hashAboveThreshold = '000000000000000f';

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      serverInstance = app.listen(0, () => {
        const address = serverInstance.address() as AddressInfo;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });

    // 1. Retrieve or create Admin user
    let admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: `admin_${uniqueId}@nakshi.test`,
          name: 'Nakshi QA Admin',
          passwordHash: await bcrypt.hash('Password123!', 10),
          role: 'ADMIN',
          wallet: { create: { balance: 50000.0 } },
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
    const artistReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Artisan Master ${uniqueId}`,
        email: `artist_${uniqueId}@nakshi.test`,
        password: 'Password123!',
        role: 'ARTIST',
        bio: 'Master weaver in traditional Bengal crafts.',
      }),
    });
    const artistData = (await artistReg.json()) as any;
    artistToken = artistData.token;
    artistId = artistData.user.id;

    // 3. Register Buyer user and top up credits
    const buyerReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Collector Buyer ${uniqueId}`,
        email: `buyer_${uniqueId}@nakshi.test`,
        password: 'Password123!',
        role: 'BUYER',
      }),
    });
    const buyerData = (await buyerReg.json()) as any;
    buyerToken = buyerData.token;
    buyerId = buyerData.user.id;

    // Top up buyer wallet with 10,000 credits
    await fetch(`${baseUrl}/api/wallet/top-up`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ amount: 10000.0 }),
    });
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
      await prisma.order.deleteMany({
        where: {
          OR: [
            { buyerId },
            { sellerId: artistId },
          ],
        },
      });
      await prisma.auction.deleteMany({
        where: { artwork: { title: { contains: uniqueId } } },
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

  // =========================================================================
  // SECTION 1: THRESHOLD BOUNDARY & DYNAMIC CONFIGURATION HANDLING
  // =========================================================================
  describe('1. Threshold Boundary & Dynamic Configuration Handling', () => {
    it('verifies exact mathematical threshold calculation via Hamming distance', () => {
      // Identical = 100%
      expect(calculateSimilarityScore(hashBase, hashBase)).toBe(100);

      // Score <= 80% should not be marked duplicate
      const evalBelow = evaluateSimilarity(hashBase, hashBelowThreshold, 80);
      expect(evalBelow.similarityScore).toBeLessThanOrEqual(80.0);
      expect(evalBelow.isDuplicate).toBe(false);

      // Score > 80% should be marked duplicate
      const evalAbove = evaluateSimilarity(hashBase, hashAboveThreshold, 80);
      expect(evalAbove.similarityScore).toBeGreaterThan(80.0);
      expect(evalAbove.isDuplicate).toBe(true);
    });

    it('creates baseline original artwork with status APPROVED', async () => {
      const res = await fetch(`${baseUrl}/api/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${artistToken}`,
        },
        body: JSON.stringify({
          title: `Baseline Heirloom Tapestry ${uniqueId}`,
          description: 'A genuine original heritage textile created in Jamalpur.',
          medium: 'Nakshi Kantha',
          price: 600.0,
          imageUrl: baselineImage,
        }),
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.artwork.moderationStatus).toBe('APPROVED');
      expect(data.artwork.imageHash).toBeDefined();
      baselineArtworkId = data.artwork.id;
    });

    it('marks candidate artwork APPROVED when visual similarity is <= 80%', async () => {
      // Use distinct image that does not match baseline
      const distinctImage = `https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&distinct=${uniqueId}`;
      const res = await fetch(`${baseUrl}/api/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${artistToken}`,
        },
        body: JSON.stringify({
          title: `Distinct Original Piece ${uniqueId}`,
          description: 'A distinctly different handcrafted terracotta artifact.',
          medium: 'Terracotta',
          price: 450.0,
          imageUrl: distinctImage,
        }),
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.artwork.moderationStatus).toBe('APPROVED');
      distinctApprovedId = data.artwork.id;

      // Verify no moderation review record was generated
      const review = await prisma.moderationReview.findFirst({
        where: { sourceArtworkId: distinctApprovedId },
      });
      expect(review).toBeNull();
    });

    it('marks candidate artwork FLAGGED when visual similarity exceeds 80% threshold', async () => {
      // Re-upload identical image matching baseline
      const res = await fetch(`${baseUrl}/api/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${artistToken}`,
        },
        body: JSON.stringify({
          title: `Flagged Suspected Copycat ${uniqueId}`,
          description: 'A duplicate upload using identical photography to baseline tapestry.',
          medium: 'Nakshi Kantha',
          price: 380.0,
          imageUrl: baselineImage,
        }),
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.artwork.moderationStatus).toBe('FLAGGED');
      flaggedDuplicateId = data.artwork.id;

      // Verify ModerationReview was created with score >= 80% and suspectedMatchId pointing to baseline
      const review = await prisma.moderationReview.findFirst({
        where: { sourceArtworkId: flaggedDuplicateId },
      });
      expect(review).toBeDefined();
      expect(review!.suspectedMatchId).toBe(baselineArtworkId);
      expect(review!.similarityScore).toBeGreaterThanOrEqual(80.0);
      expect(review!.actionTaken).toBeNull();
      moderationReviewId = review!.id;
    });
  });

  // =========================================================================
  // SECTION 2: LISTING VISIBILITY ACROSS MARKETPLACE MODULES
  // =========================================================================
  describe('2. Listing Visibility Across Marketplace Modules', () => {
    it('includes APPROVED artwork in public gallery browsing (GET /api/artworks)', async () => {
      const res = await fetch(`${baseUrl}/api/artworks?limit=100`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;

      const ids = data.artworks.map((a: any) => a.id);
      expect(ids).toContain(baselineArtworkId);
      expect(ids).toContain(distinctApprovedId);
    });

    it('excludes FLAGGED artwork from public gallery browsing (GET /api/artworks)', async () => {
      const res = await fetch(`${baseUrl}/api/artworks?limit=100`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;

      const ids = data.artworks.map((a: any) => a.id);
      expect(ids).not.toContain(flaggedDuplicateId);
    });

    it('excludes FLAGGED artwork from keyword search (GET /api/artworks?search=...)', async () => {
      const res = await fetch(`${baseUrl}/api/artworks?search=${encodeURIComponent(uniqueId)}`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;

      const ids = data.artworks.map((a: any) => a.id);
      expect(ids).toContain(baselineArtworkId);
      expect(ids).toContain(distinctApprovedId);
      expect(ids).not.toContain(flaggedDuplicateId);
    });

    it('excludes FLAGGED artwork when filtering by medium (GET /api/artworks?medium=...)', async () => {
      const res = await fetch(`${baseUrl}/api/artworks?medium=Nakshi%20Kantha&limit=100`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;

      const ids = data.artworks.map((a: any) => a.id);
      expect(ids).toContain(baselineArtworkId);
      expect(ids).not.toContain(flaggedDuplicateId);
    });

    it('rejects order checkout (POST /api/orders/checkout) for FLAGGED artwork with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({
          artworkId: flaggedDuplicateId,
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toMatch(/not approved/i);
    });

    it('rejects scheduling a live auction (POST /api/auctions) for FLAGGED artwork with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          artworkId: flaggedDuplicateId,
          startingBid: 200.0,
          minIncrement: 20.0,
          startTime: new Date(Date.now() + 3600000).toISOString(),
          endTime: new Date(Date.now() + 7200000).toISOString(),
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toMatch(/moderation status/i);
    });
  });

  // =========================================================================
  // SECTION 3: ADMINISTRATOR REVIEW QUEUE ROUTING & DECISION LIFECYCLE
  // =========================================================================
  describe('3. Administrator Review Queue Routing & Decision Lifecycle', () => {
    it('returns flagged item in queue with split-screen comparison metadata', async () => {
      const res = await fetch(`${baseUrl}/api/moderation/queue`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      const queueItem = data.queue.find((q: any) => q.sourceArtworkId === flaggedDuplicateId);

      expect(queueItem).toBeDefined();
      expect(queueItem.id).toBe(moderationReviewId);
      expect(queueItem.similarityScore).toBeGreaterThanOrEqual(80.0);

      // Validate source artwork fields
      expect(queueItem.sourceArtwork.id).toBe(flaggedDuplicateId);
      expect(queueItem.sourceArtwork.title).toContain('Flagged Suspected Copycat');
      expect(queueItem.sourceArtwork.price).toBe(380.0);
      expect(queueItem.sourceArtwork.artist).toBeDefined();

      // Validate suspected match fields
      expect(queueItem.suspectedMatchArtwork).toBeDefined();
      expect(queueItem.suspectedMatchArtwork.id).toBe(baselineArtworkId);
      expect(queueItem.suspectedMatchArtwork.title).toContain('Baseline Heirloom');
    });

    it('approving a flagged artwork updates status to APPROVED and unblocks marketplace visibility and checkout', async () => {
      // 1. Admin approves the flagged artwork
      const reviewRes = await fetch(`${baseUrl}/api/moderation/${moderationReviewId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          action: 'APPROVE',
          notes: 'Artisan verified as authentic studio apprentice variation.',
        }),
      });

      expect(reviewRes.status).toBe(200);
      const reviewData = (await reviewRes.json()) as any;
      expect(reviewData.actionTaken).toBe('APPROVED');
      expect(reviewData.artwork.moderationStatus).toBe('APPROVED');

      // 2. Verify database record
      const dbArtwork = await prisma.artwork.findUnique({
        where: { id: flaggedDuplicateId },
      });
      expect(dbArtwork!.moderationStatus).toBe('APPROVED');

      // 3. Verify public search now includes the approved artwork
      const searchRes = await fetch(`${baseUrl}/api/artworks?search=${encodeURIComponent(uniqueId)}`);
      expect(searchRes.status).toBe(200);
      const searchData = (await searchRes.json()) as any;
      const searchIds = searchData.artworks.map((a: any) => a.id);
      expect(searchIds).toContain(flaggedDuplicateId);

      // 4. Verify checkout succeeds now that artwork is APPROVED
      const checkoutRes = await fetch(`${baseUrl}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({
          artworkId: flaggedDuplicateId,
        }),
      });
      expect(checkoutRes.status).toBe(201);
      const checkoutData = (await checkoutRes.json()) as any;
      expect(checkoutData.order).toBeDefined();
      expect(checkoutData.order.artworkId).toBe(flaggedDuplicateId);
    });

    it('rejecting a flagged artwork updates status to REJECTED and permanently prevents purchase and visibility', async () => {
      // 1. Create a second duplicate to test administrative rejection
      const createRes = await fetch(`${baseUrl}/api/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${artistToken}`,
        },
        body: JSON.stringify({
          title: `Copycat to be Rejected ${uniqueId}`,
          description: 'Another duplicate listing intended for administrative rejection test.',
          medium: 'Nakshi Kantha',
          price: 320.0,
          imageUrl: baselineImage,
        }),
      });

      expect(createRes.status).toBe(201);
      const createData = (await createRes.json()) as any;
      const toRejectId = createData.artwork.id;
      expect(createData.artwork.moderationStatus).toBe('FLAGGED');

      // 2. Admin rejects the artwork
      const rejectRes = await fetch(`${baseUrl}/api/moderation/${toRejectId}/review`, {
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

      // 3. Verify public search does NOT include the rejected artwork
      const searchRes = await fetch(`${baseUrl}/api/artworks?search=${encodeURIComponent(uniqueId)}`);
      const searchData = (await searchRes.json()) as any;
      const ids = searchData.artworks.map((a: any) => a.id);
      expect(ids).not.toContain(toRejectId);

      // 4. Verify checkout fails with 400 for rejected artwork
      const checkoutRes = await fetch(`${baseUrl}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({
          artworkId: toRejectId,
        }),
      });
      expect(checkoutRes.status).toBe(400);
    });

    it('allows an administrator to explicitly flag any active listing and route to review queue (POST /api/moderation/:id/flag)', async () => {
      // Distinct approved artwork is currently visible
      const flagRes = await fetch(`${baseUrl}/api/moderation/${distinctApprovedId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          reason: 'Provenance questioned by community report; manual review required.',
        }),
      });

      expect(flagRes.status).toBe(200);
      const flagData = (await flagRes.json()) as any;
      expect(flagData.artwork.moderationStatus).toBe('FLAGGED');
      expect(flagData.review).toBeDefined();
      expect(flagData.review.adminNotes).toContain('Provenance questioned');

      // Verify listing is immediately hidden from public marketplace search
      const searchRes = await fetch(`${baseUrl}/api/artworks?search=${encodeURIComponent(uniqueId)}`);
      const searchData = (await searchRes.json()) as any;
      const ids = searchData.artworks.map((a: any) => a.id);
      expect(ids).not.toContain(distinctApprovedId);

      // Verify listing appears in admin review queue
      const queueRes = await fetch(`${baseUrl}/api/moderation/queue`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const queueData = (await queueRes.json()) as any;
      const queueItem = queueData.queue.find((q: any) => q.sourceArtworkId === distinctApprovedId);
      expect(queueItem).toBeDefined();
      expect(queueItem.sourceArtwork.id).toBe(distinctApprovedId);
    });
  });
});
