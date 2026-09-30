import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class SellerService {
  /**
   * Retrieves sales performance metrics and summary statistics for a seller/artist.
   */
  public static async getSellerMetrics(sellerId: string) {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!seller) {
      throw new AppError('Seller not found', 404);
    }

    if (seller.role !== Role.ARTIST && seller.role !== Role.ADMIN) {
      throw new AppError('Only ARTIST or ADMIN accounts can access seller sales metrics', 403);
    }

    // Fetch all orders where this user is the seller
    const orders = await prisma.order.findMany({
      where: { sellerId },
      include: {
        artwork: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            medium: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all artworks uploaded by this artist
    const artworks = await prisma.artwork.findMany({
      where: { artistId: sellerId },
      select: {
        id: true,
        price: true,
        availability: true,
        moderationStatus: true,
      },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.amountPaid), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0;

    const totalArtworks = artworks.length;
    const activeListings = artworks.filter(
      (a) => a.availability === 'AVAILABLE' && a.moderationStatus === 'APPROVED'
    ).length;
    const pendingArtworks = artworks.filter((a) => a.moderationStatus === 'PENDING').length;
    const soldArtworks = artworks.filter((a) => a.availability === 'SOLD').length;

    const recentSales = orders.slice(0, 5).map((order) => ({
      id: order.id,
      artworkId: order.artworkId,
      artworkTitle: order.artwork?.title ?? 'Heritage Artwork',
      artworkImageUrl: order.artwork?.imageUrl ?? '',
      artworkMedium: order.artwork?.medium ?? 'Handcraft',
      buyerName: order.buyer.name,
      buyerEmail: order.buyer.email,
      amountPaid: Number(order.amountPaid),
      createdAt: order.createdAt,
    }));

    return {
      seller: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
      },
      metrics: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders,
        averageOrderValue,
        activeListings,
        pendingArtworks,
        soldArtworks,
        totalArtworks,
      },
      recentSales,
    };
  }
}
