import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('[Cleanup] Starting safe cleanup of test and dummy data...');

  // 1. Identify test users to remove
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: '179' } },
        { email: { contains: 'test_' } },
        { email: { contains: 'shilpi_' } },
        { email: { contains: 'google_user_' } },
        { email: { contains: 'test_err' } },
        { email: 'rokeya@gmail.com' },
        { email: 'sama@gmail.com' },
        { name: { contains: 'Test' } },
        { name: { contains: 'Acceptance' } },
        { name: { contains: 'Playwright' } },
        { name: { contains: 'Shilpi' } },
      ],
    },
    select: { id: true, email: true },
  });

  const testUserIds = testUsers.map((u) => u.id);
  console.log(`[Cleanup] Identified ${testUserIds.length} automated test / legacy accounts.`);

  // 2. Identify test and broken artworks
  const testArtworks = await prisma.artwork.findMany({
    where: {
      OR: [
        { artistId: { in: testUserIds } },
        { title: { contains: 'Test' } },
        { title: { contains: 'Playwright' } },
        { title: { contains: 'Their Artwork' } },
        { title: { contains: 'My Artwork' } },
        { title: { contains: '179' } },
        { title: { contains: 'Socket' } },
        { title: { contains: 'Bidding' } },
        { title: 'Heritage craft' },
        { title: 'Heritage craft123' },
        { title: 'Flow' },
        { title: 'hairloom' },
        { title: 'Giana' },
        { title: 'Wildflowers Sway' },
        { imageUrl: { contains: 'example.com' } },
        { imageUrl: { contains: 'placeholder' } },
        { imageUrl: { contains: 'socket-test' } },
        { imageUrl: { contains: 'photo-test-lot' } },
        { imageUrl: { contains: '/uploads/' } },
        { imageUrl: { contains: 'images.unsplash.com' } },
        { imageUrl: '/images/nakshi-kantha-quilt.jpg' },
        { imageUrl: '/images/jamdani-saree.jpg' },
        { imageUrl: '/images/terracotta-horse.jpg' },
        { imageUrl: '/images/bamboo-lamp.jpg' },
      ],
    },
    select: { id: true, title: true },
  });

  const testArtworkIds = testArtworks.map((a) => a.id);
  console.log(`[Cleanup] Identified ${testArtworkIds.length} test or broken artworks.`);

  // 3. Delete dependent records in order to respect FK constraints
  // Delete bids on test auctions or by test users
  const deletedBids = await prisma.auctionBid.deleteMany({
    where: {
      OR: [
        { bidderId: { in: testUserIds } },
        { auction: { artworkId: { in: testArtworkIds } } },
      ],
    },
  });
  console.log(`[Cleanup] Deleted ${deletedBids.count} test auction bids.`);

  // Delete auctions associated with test artworks
  const deletedAuctions = await prisma.auction.deleteMany({
    where: {
      artworkId: { in: testArtworkIds },
    },
  });
  console.log(`[Cleanup] Deleted ${deletedAuctions.count} test auctions.`);

  // Delete exhibition artworks referencing test artworks
  const deletedExhArt = await prisma.exhibitionArtwork.deleteMany({
    where: {
      artworkId: { in: testArtworkIds },
    },
  });
  console.log(`[Cleanup] Deleted ${deletedExhArt.count} test exhibition artwork links.`);

  // Delete exhibition visits by test users
  const deletedVisits = await prisma.exhibitionVisit.deleteMany({
    where: {
      userId: { in: testUserIds },
    },
  });
  console.log(`[Cleanup] Deleted ${deletedVisits.count} test exhibition visits.`);

  // Delete exhibition tickets bought by test users
  const deletedTickets = await prisma.exhibitionTicket.deleteMany({
    where: {
      buyerId: { in: testUserIds },
    },
  });
  console.log(`[Cleanup] Deleted ${deletedTickets.count} test exhibition tickets.`);

  // Delete all moderation reviews referencing test artworks or test users
  const deletedReviews = await prisma.moderationReview.deleteMany({
    where: {
      OR: [
        { sourceArtworkId: { in: testArtworkIds } },
        { suspectedMatchId: { in: testArtworkIds } },
        { adminId: { in: testUserIds } },
        { similarityScore: 100 }, // Clean up legacy 100% duplicate test records
      ],
    },
  });
  console.log(`[Cleanup] Deleted ${deletedReviews.count} test moderation reviews.`);

  // Delete comments on test artworks or by test users
  const deletedComments = await prisma.artworkComment.deleteMany({
    where: {
      OR: [
        { artworkId: { in: testArtworkIds } },
        { userId: { in: testUserIds } },
      ],
    },
  });
  console.log(`[Cleanup] Deleted ${deletedComments.count} test comments.`);

  // Delete orders referencing test artworks or test users
  const deletedOrders = await prisma.order.deleteMany({
    where: {
      OR: [
        { artworkId: { in: testArtworkIds } },
        { buyerId: { in: testUserIds } },
        { sellerId: { in: testUserIds } },
      ],
    },
  });
  console.log(`[Cleanup] Deleted ${deletedOrders.count} test orders.`);

  // Delete credit transactions of test users
  const testWallets = await prisma.wallet.findMany({
    where: { userId: { in: testUserIds } },
    select: { id: true },
  });
  const testWalletIds = testWallets.map((w) => w.id);

  const deletedTx = await prisma.creditTransaction.deleteMany({
    where: { walletId: { in: testWalletIds } },
  });
  console.log(`[Cleanup] Deleted ${deletedTx.count} test credit transactions.`);

  // Delete test wallets
  const deletedWallets = await prisma.wallet.deleteMany({
    where: { id: { in: testWalletIds } },
  });
  console.log(`[Cleanup] Deleted ${deletedWallets.count} test wallets.`);

  // Delete test artworks
  const deletedArts = await prisma.artwork.deleteMany({
    where: { id: { in: testArtworkIds } },
  });
  console.log(`[Cleanup] Deleted ${deletedArts.count} test artworks.`);

  // Delete test users
  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { in: testUserIds } },
  });
  console.log(`[Cleanup] Deleted ${deletedUsers.count} test users.`);

  // Also clean up any lingering duplicate test exhibitions with 179... in title
  const testExhibitions = await prisma.exhibition.findMany({
    where: {
      OR: [
        { title: { contains: '179' } },
        { title: { contains: 'Test' } },
        { title: { contains: 'Playwright' } },
      ],
    },
    select: { id: true },
  });
  if (testExhibitions.length > 0) {
    const exhIds = testExhibitions.map((e) => e.id);
    await prisma.exhibitionArtwork.deleteMany({ where: { exhibitionId: { in: exhIds } } });
    await prisma.exhibitionTicket.deleteMany({ where: { exhibitionId: { in: exhIds } } });
    await prisma.exhibitionVisit.deleteMany({ where: { exhibitionId: { in: exhIds } } });
    await prisma.exhibition.deleteMany({ where: { id: { in: exhIds } } });
    console.log(`[Cleanup] Deleted ${testExhibitions.length} test exhibitions.`);
  }

  console.log('[Cleanup] Safe cleanup finished successfully.');
}

main()
  .catch((e) => {
    console.error('[Cleanup] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
