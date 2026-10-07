import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.$executeRaw`UPDATE "Auction" SET status = 'CLOSED' WHERE status = 'ENDED'`.then(() => {
  console.log('Updated rows');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
