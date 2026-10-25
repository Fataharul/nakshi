import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Seeding demo accounts for Nakshi...');

  const saltRounds = 10;
  const commonPassword = await bcrypt.hash('Password123!', saltRounds);

  const users = [
    {
      email: 'buyer@nakshi.test',
      name: 'Tanvir Ahmed',
      role: Role.BUYER,
      bio: 'Enthusiastic collector of traditional Bengali textiles and Nakshi Kantha tapestries.',
      passwordHash: commonPassword,
    },
    {
      email: 'artist@nakshi.test',
      name: 'Rokeya Begum',
      role: Role.ARTIST,
      bio: 'Master artisan specializing in handloom Jamdani and embroidered heirloom quilts.',
      passwordHash: commonPassword,
    },
    {
      email: 'organizer@nakshi.test',
      name: 'Naveed Chowdhury',
      role: Role.ORGANIZER,
      bio: 'Curator of heritage art exhibitions and digital folk craft galleries.',
      passwordHash: commonPassword,
    },
    {
      email: 'admin@nakshi.test',
      name: 'Nakshi Administrator',
      role: Role.ADMIN,
      bio: 'Platform administrator and artwork moderation director.',
      passwordHash: commonPassword,
    },
  ];

  for (const user of users) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
      include: { wallet: true },
    });

    if (!existing) {
      const created = await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          role: user.role,
          bio: user.bio,
          passwordHash: user.passwordHash,
          wallet: {
            create: {
              balance: 0.0,
            },
          },
        },
      });
      console.log(`[Seed] Created ${user.role} user: ${created.email}`);
    } else {
      // Ensure wallet exists if user was previously created
      if (!existing.wallet) {
        await prisma.wallet.create({
          data: {
            userId: existing.id,
            balance: 0.0,
          },
        });
        console.log(`[Seed] Created missing wallet for: ${existing.email}`);
      }
      console.log(`[Seed] User already exists: ${user.email}`);
    }
  }

  // Seed authentic heritage artworks for artist
  const artist = await prisma.user.findUnique({
    where: { email: 'artist@nakshi.test' },
  });

  if (artist) {
    const heritageArtworks = [
      {
        title: 'Sonargaon Heritage Jamdani Saree',
        medium: 'Handloom Jamdani',
        style: 'Floral Motifs',
        description: 'Authentic 200-count handloom muslin Jamdani woven with pure zari floral jaal motifs by master weavers.',
        dimensions: '5.5 meters x 1.2 meters',
        weight: 0.85,
        weightUnit: 'kg',
        price: 1250.0,
        imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        availability: 'AVAILABLE' as const,
        moderationStatus: 'APPROVED' as const,
      },
      {
        title: 'Mayurpakkhi Heirloom Nakshi Kantha',
        medium: 'Nakshi Kantha',
        style: 'Traditional Folk',
        description: 'Traditional quilt featuring intricate run-stitch peacocks, lotus pond medallions, and village folklore.',
        dimensions: '72 x 54 inches',
        weight: 1.4,
        weightUnit: 'kg',
        price: 850.0,
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        availability: 'AVAILABLE' as const,
        moderationStatus: 'APPROVED' as const,
      },
      {
        title: 'Terracotta Folk Horse Sculpture',
        medium: 'Terracotta Clay',
        style: 'Sculptural & Relic',
        description: 'Hand-molded kiln-fired terracotta folk artifact embodying ancient North Bengal sacrificial horse motifs.',
        dimensions: '35 x 22 x 12 cm',
        weight: 2.8,
        weightUnit: 'kg',
        price: 450.0,
        imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
        availability: 'AVAILABLE' as const,
        moderationStatus: 'APPROVED' as const,
      },
      {
        title: 'Dhamrai Bell Metal Royal Kansa Urn',
        medium: 'Brass & Bell Metal',
        style: 'Royal Heritage',
        description: 'Hand-beaten high-resonance lost-wax cast bell metal ceremonial vessel polished with natural clay.',
        dimensions: '28 x 28 x 38 cm',
        weight: 4.2,
        weightUnit: 'kg',
        price: 920.0,
        imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
        availability: 'AVAILABLE' as const,
        moderationStatus: 'APPROVED' as const,
      },
      {
        title: 'Sylhet Imperial Murta Cane Shital Pati',
        medium: 'Shital Pati Cane Weave',
        style: 'Geometric Jaal',
        description: 'Master-grade cold mat handwoven from strips of green Murta reed featuring geometric diamond weave.',
        dimensions: '84 x 60 inches',
        weight: 1.2,
        weightUnit: 'kg',
        price: 640.0,
        imageUrl: 'https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=800&q=80',
        availability: 'AVAILABLE' as const,
        moderationStatus: 'APPROVED' as const,
      },
      {
        title: 'Golden Fiber Embroidered Jute Tapestry',
        medium: 'Jute Fiber Craft',
        style: 'Contemporary Heritage',
        description: 'Naturally dyed spun golden jute fibers braided and cross-stitched into an expansive wall tapestry.',
        dimensions: '40 x 30 inches',
        weight: 1.5,
        weightUnit: 'kg',
        price: 360.0,
        imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
        availability: 'AVAILABLE' as const,
        moderationStatus: 'APPROVED' as const,
      },
      {
        title: 'Chittagong Carved Sheesham Wood Casket',
        medium: 'Wood Carving & Inlay',
        style: 'Floral Motifs',
        description: 'Seasoned solid rosewood chest adorned with deep relief floral carvings and brass wire inlays.',
        dimensions: '30 x 20 x 15 cm',
        weight: 2.1,
        weightUnit: 'kg',
        price: 780.0,
        imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
        availability: 'AVAILABLE' as const,
        moderationStatus: 'APPROVED' as const,
      },
      {
        title: 'Rajshahi Glazed Heritage Clay Pitcher',
        medium: 'Ceramic & Traditional Pottery',
        style: 'Traditional Folk',
        description: 'Wheel-thrown red river silt vessel wood-fired with natural terracotta slip and glazed neck.',
        dimensions: '25 x 25 x 32 cm',
        weight: 1.9,
        weightUnit: 'kg',
        price: 320.0,
        imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
        availability: 'AVAILABLE' as const,
        moderationStatus: 'APPROVED' as const,
      },
    ];

    for (const art of heritageArtworks) {
      const existingArt = await prisma.artwork.findFirst({
        where: { title: art.title },
      });

      if (!existingArt) {
        await prisma.artwork.create({
          data: {
            ...art,
            artistId: artist.id,
          },
        });
        console.log(`[Seed] Created heritage artwork: ${art.title}`);
      }
    }
  }

  // Seed demo exhibitions for organizer
  const organizer = await prisma.user.findUnique({
    where: { email: 'organizer@nakshi.test' },
  });

  if (organizer) {
    // Seed organizer-owned artworks so exhibitions feature the organizer's own collection
    const organizerHeritageArtworks = [
      {
        title: 'Sonargaon Heirloom Nakshi Kantha Quilt',
        medium: 'Nakshi Kantha',
        style: 'Traditional Folk',
        description: 'Multi-layered antique quilt embroidered with traditional lotus mandala and rural folklore narratives.',
        price: 550.0,
        imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        availability: 'AVAILABLE' as const,
        moderationStatus: 'APPROVED' as const,
      },
      {
        title: 'Ancient Mahasthangarh Red Silt Plaque',
        medium: 'Terracotta Clay',
        style: 'Sculptural & Relic',
        description: 'Hand-carved temple architectural motif depicting tree of life in natural kiln-fired clay.',
        price: 420.0,
        imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
        availability: 'AVAILABLE' as const,
        moderationStatus: 'APPROVED' as const,
      },
      {
        title: 'Imperial Jamdani Nilambari Drape',
        medium: 'Handloom Jamdani',
        style: 'Royal Heritage',
        description: 'Indigo-dyed fine muslin hand-loomed with silver-gilt floral jaldar designs from Rupganj.',
        price: 1100.0,
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        availability: 'AVAILABLE' as const,
        moderationStatus: 'APPROVED' as const,
      },
    ];

    for (const art of organizerHeritageArtworks) {
      const existingArt = await prisma.artwork.findFirst({
        where: { title: art.title },
      });
      if (!existingArt) {
        await prisma.artwork.create({
          data: {
            ...art,
            artistId: organizer.id,
          },
        });
      }
    }

    const artworks = await prisma.artwork.findMany({
      where: { artistId: organizer.id },
    });
    const now = new Date();

    const demoExhibitions = [
      {
        title: 'Threads of Bengal: Sacred Folk Tapestries',
        description: 'An immersive virtual curation celebrating heirloom Nakshi Kantha quilts and hand-spun rural tapestries from Sonargaon and Rajshahi.',
        bannerUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
        ticketPrice: 50.0,
        startTime: new Date(now.getTime() - 86400000 * 2),
        endTime: new Date(now.getTime() + 86400000 * 14),
        vipStartTime: new Date(now.getTime() - 86400000 * 2),
        vipEndTime: new Date(now.getTime() - 86400000),
        layoutConfig: {
          curatorNote: 'Walk through the 3 ceremonial halls to experience centuries of indigenous needlework traditions.',
          walls: ['North Hall: Heirloom Quilts', 'East Hall: Zari Borders', 'South Hall: Contemporary Interpretations'],
        },
      },
      {
        title: 'Dhaka Terracotta & Glazed Relics 2026',
        description: 'Exploring archaeological red clay vessels, temple plaques, and wood-fired folk motifs from ancient Bengal dynasties.',
        bannerUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
        ticketPrice: 35.0,
        startTime: new Date(now.getTime() + 86400000 * 3),
        endTime: new Date(now.getTime() + 86400000 * 20),
        vipStartTime: new Date(now.getTime() + 86400000 * 2),
        vipEndTime: new Date(now.getTime() + 86400000 * 3),
        layoutConfig: {
          curatorNote: 'A tactile virtual walkthrough of ancient riverine clay craftsmanship.',
          walls: ['Main Gallery: Ancient Plaques', 'West Gallery: Ritual Vessels'],
        },
      },
      {
        title: 'Royal Muslin & Masterpiece Jamdani Retrospective',
        description: 'VIP Collector Exclusive exhibition spotlighting 300-count geometric Jamdani sarees and Mughal royal court weaves.',
        bannerUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
        ticketPrice: 75.0,
        startTime: new Date(now.getTime() - 3600000),
        endTime: new Date(now.getTime() + 86400000 * 7),
        vipStartTime: new Date(now.getTime() - 3600000),
        vipEndTime: new Date(now.getTime() + 86400000 * 2),
        layoutConfig: {
          curatorNote: 'VIP Collector Preview: Early access to private collection heirlooms.',
          walls: ['Royal Pavilion: Floral Jaal', 'Weavers Studio: Historical Looms'],
        },
      },
    ];

    for (const exh of demoExhibitions) {
      const existing = await prisma.exhibition.findFirst({
        where: { title: exh.title },
      });

      if (!existing) {
        const created = await prisma.exhibition.create({
          data: {
            ...exh,
            organizerId: organizer.id,
          },
        });

        // Attach artworks
        for (let i = 0; i < artworks.length; i++) {
          await prisma.exhibitionArtwork.create({
            data: {
              exhibitionId: created.id,
              artworkId: artworks[i].id,
              wallPosition: i + 1,
              posX: (i % 3) * 30 + 15,
              posY: Math.floor(i / 3) * 40 + 20,
            },
          });
        }
        console.log(`[Seed] Created demo exhibition: ${exh.title}`);
      } else {
        // Refresh timing windows so demo/e2e states remain valid
        await prisma.exhibition.update({
          where: { id: existing.id },
          data: {
            startTime: exh.startTime,
            endTime: exh.endTime,
            vipStartTime: exh.vipStartTime,
            vipEndTime: exh.vipEndTime,
          },
        });

        // Ensure organizer-owned artworks are attached
        const existingExhArtworks = await prisma.exhibitionArtwork.findMany({
          where: { exhibitionId: existing.id },
        });
        if (existingExhArtworks.length === 0 && artworks.length > 0) {
          for (let i = 0; i < artworks.length; i++) {
            await prisma.exhibitionArtwork.create({
              data: {
                exhibitionId: existing.id,
                artworkId: artworks[i].id,
                wallPosition: i + 1,
                posX: (i % 3) * 30 + 15,
                posY: Math.floor(i / 3) * 40 + 20,
              },
            });
          }
        }
        console.log(`[Seed] Refreshed demo exhibition: ${exh.title}`);
      }
    }
  }

  console.log('[Seed] Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('[Seed] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
