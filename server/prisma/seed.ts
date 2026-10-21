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
