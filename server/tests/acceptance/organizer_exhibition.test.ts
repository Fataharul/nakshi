import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../../src/server';
import { prisma } from '../../src/config/prisma';

describe('Organizer Artwork Upload & Exhibition Ownership Acceptance Tests', () => {
  let serverInstance: http.Server;
  let baseUrl: string;
  const uniqueId = Date.now();
  let organizerToken: string;
  let organizerId: string;
  let artistToken: string;
  let artistId: string;
  let artistArtworkId: string;
  let organizerArtworkId: string;

  const organizerUser = {
    name: `Curator Organizer ${uniqueId}`,
    email: `organizer_${uniqueId}_${Math.random().toString(36).substring(2, 7)}@nakshi.test`,
    password: 'Password123!',
    role: 'ORGANIZER',
    bio: 'Folk art curator and exhibition designer.',
  };

  const artistUser = {
    name: `Independent Artisan ${uniqueId}`,
    email: `artist_${uniqueId}_${Math.random().toString(36).substring(2, 7)}@nakshi.test`,
    password: 'Password123!',
    role: 'ARTIST',
    bio: 'Master terracotta sculptor.',
  };

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      serverInstance = app.listen(0, () => {
        const address = serverInstance.address() as AddressInfo;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });

    // 1. Register Organizer
    const orgReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(organizerUser),
    });
    const orgData = (await orgReg.json()) as any;
    expect(orgReg.status).toBe(201);
    organizerToken = orgData.token;
    organizerId = orgData.user.id;

    // 2. Register Artist
    const artReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(artistUser),
    });
    const artData = (await artReg.json()) as any;
    expect(artReg.status).toBe(201);
    artistToken = artData.token;
    artistId = artData.user.id;

    // 3. Artist creates an artwork
    const artistArtworkRes = await fetch(`${baseUrl}/api/artworks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${artistToken}`,
      },
      body: JSON.stringify({
        title: `Artist Sculpture ${uniqueId}`,
        medium: 'Terracotta Clay',
        price: 350,
        imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800',
        description: 'Original terracotta clay sculpture by independent artisan.',
      }),
    });
    const artistArtworkData = (await artistArtworkRes.json()) as any;
    expect(artistArtworkRes.status).toBe(201);
    artistArtworkId = artistArtworkData.artwork.id;
  });

  afterAll(async () => {
    // Cleanup created records
    try {
      await prisma.exhibitionArtwork.deleteMany({
        where: {
          artworkId: { in: [artistArtworkId, organizerArtworkId].filter(Boolean) },
        },
      });
      await prisma.exhibition.deleteMany({
        where: { organizerId },
      });
      await prisma.artwork.deleteMany({
        where: { id: { in: [artistArtworkId, organizerArtworkId].filter(Boolean) } },
      });
      await prisma.wallet.deleteMany({
        where: { userId: { in: [organizerId, artistId].filter(Boolean) } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [organizerId, artistId].filter(Boolean) } },
      });
    } catch {
      // Ignore cleanup error in test tear-down
    }

    if (serverInstance) {
      await new Promise<void>((resolve) => serverInstance.close(() => resolve()));
    }
  });

  it('allows ORGANIZER to upload and create their own artwork', async () => {
    const res = await fetch(`${baseUrl}/api/artworks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${organizerToken}`,
      },
      body: JSON.stringify({
        title: `Organizer Collection Tapestry ${uniqueId}`,
        medium: 'Nakshi Kantha',
        price: 600,
        imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
        description: 'Curated heritage tapestry from organizer private collection.',
      }),
    });

    const data = (await res.json()) as any;
    expect(res.status).toBe(201);
    expect(data.artwork).toBeDefined();
    expect(data.artwork.title).toBe(`Organizer Collection Tapestry ${uniqueId}`);
    expect(data.artwork.artistId).toBe(organizerId);
    organizerArtworkId = data.artwork.id;
  });

  it('allows ORGANIZER to view their uploaded artworks via /my-artworks', async () => {
    const res = await fetch(`${baseUrl}/api/artworks/my-artworks`, {
      headers: {
        Authorization: `Bearer ${organizerToken}`,
      },
    });

    const data = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(Array.isArray(data.artworks)).toBe(true);
    const found = data.artworks.some((a: any) => a.id === organizerArtworkId);
    expect(found).toBe(true);
  });

  it('rejects exhibition creation when ORGANIZER selects artwork they do NOT own', async () => {
    const startTime = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    const endTime = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

    const res = await fetch(`${baseUrl}/api/exhibitions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${organizerToken}`,
      },
      body: JSON.stringify({
        title: `Unauthorized Artworks Exhibition ${uniqueId}`,
        description: 'Attempting to include independent artist artwork without ownership.',
        ticketPrice: 25,
        startTime,
        endTime,
        artworkIds: [artistArtworkId], // not owned by organizer!
      }),
    });

    const data = (await res.json()) as any;
    expect(res.status).toBe(400);
    expect(data.error).toContain('Organizers can only showcase their own uploaded artworks');
  });

  it('successfully creates exhibition when ORGANIZER selects their OWN uploaded artwork', async () => {
    const startTime = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    const endTime = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

    const res = await fetch(`${baseUrl}/api/exhibitions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${organizerToken}`,
      },
      body: JSON.stringify({
        title: `Curator Sacred Spaces ${uniqueId}`,
        description: 'Exclusively showcasing organizer-owned heritage collection.',
        ticketPrice: 30,
        startTime,
        endTime,
        artworkIds: [organizerArtworkId], // owned by organizer!
        layoutConfig: {
          curatorNote: 'Organized and owned by curator.',
          walls: ['Hall 1', 'Hall 2'],
        },
      }),
    });

    const data = (await res.json()) as any;
    expect(res.status).toBe(201);
    expect(data.exhibition).toBeDefined();
    expect(data.exhibition.title).toBe(`Curator Sacred Spaces ${uniqueId}`);
    expect(data.exhibition.organizerId).toBe(organizerId);

    // Verify exhibition details include the artwork
    const getRes = await fetch(`${baseUrl}/api/exhibitions/${data.exhibition.id}`);
    const getData = (await getRes.json()) as any;
    expect(getRes.status).toBe(200);
    expect(getData.exhibition.artworks.length).toBe(1);
    expect(getData.exhibition.artworks[0].artwork.id).toBe(organizerArtworkId);
  });
});
