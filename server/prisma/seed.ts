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
