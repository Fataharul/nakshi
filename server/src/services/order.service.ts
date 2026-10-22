import { prisma } from '../config/prisma';
import { AppError } from './auth.service';
import { TransactionType, Prisma } from '@prisma/client';

export class OrderService {
  /**
   * Executes atomic fixed-price purchase of an artwork using internal platform credits.
   * Guarantees row-level concurrency protection against simultaneous double-purchasing.
   */
  public static async checkout(buyerId: string, artworkId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch artwork and seller information
      const artwork = await tx.artwork.findUnique({
        where: { id: artworkId },
        include: {
          artist: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!artwork) {
        throw new AppError('Artwork not found', 404);
      }

      if (artwork.moderationStatus === 'REJECTED') {
        throw new AppError('This artwork has been rejected by moderation and cannot be purchased', 400);
      }

      if (artwork.availability !== 'AVAILABLE') {
        throw new AppError('Artwork is no longer available for purchase', 409);
      }

      // 2. Reject self-purchase
      if (artwork.artistId === buyerId) {
        throw new AppError('Artists cannot purchase their own artworks', 400);
      }

      // 3. Fetch buyer wallet (create if missing)
      let buyerWallet = await tx.wallet.findUnique({
        where: { userId: buyerId },
      });

      if (!buyerWallet) {
        buyerWallet = await tx.wallet.create({
          data: {
            userId: buyerId,
            balance: new Prisma.Decimal('0.00'),
          },
        });
      }

      // 4. Validate buyer has sufficient credit balance
      if (buyerWallet.balance.lessThan(artwork.price)) {
        throw new AppError(
          `Insufficient credit balance. Required: ${artwork.price} Credits, Available: ${buyerWallet.balance} Credits`,
          400
        );
      }

      // 5. Atomic optimistic concurrency lock on single-edition artwork
      const updateResult = await tx.artwork.updateMany({
        where: {
          id: artworkId,
          availability: 'AVAILABLE',
        },
        data: {
          availability: 'SOLD',
        },
      });

      if (updateResult.count === 0) {
        throw new AppError('Artwork was purchased by another buyer or is no longer available', 409);
      }

      // 6. Fetch seller wallet (create if missing)
      let sellerWallet = await tx.wallet.findUnique({
        where: { userId: artwork.artistId },
      });

      if (!sellerWallet) {
        sellerWallet = await tx.wallet.create({
          data: {
            userId: artwork.artistId,
            balance: new Prisma.Decimal('0.00'),
          },
        });
      }

      // 7. Atomically debit buyer wallet
      const updatedBuyerWallet = await tx.wallet.update({
        where: { id: buyerWallet.id },
        data: {
          balance: {
            decrement: artwork.price,
          },
        },
      });

      // 8. Atomically credit seller wallet
      await tx.wallet.update({
        where: { id: sellerWallet.id },
        data: {
          balance: {
            increment: artwork.price,
          },
        },
      });

      // 9. Create Order record
      const order = await tx.order.create({
        data: {
          buyerId,
          sellerId: artwork.artistId,
          artworkId,
          amountPaid: artwork.price,
        },
      });

      // 10. Record CreditTransaction audit trail for buyer
      await tx.creditTransaction.create({
        data: {
          walletId: buyerWallet.id,
          amount: artwork.price,
          type: TransactionType.PURCHASE_DEBIT,
          description: `Purchased "${artwork.title}" from ${artwork.artist.name}`,
          referenceId: order.id,
        },
      });

      // 11. Record CreditTransaction audit trail for seller
      await tx.creditTransaction.create({
        data: {
          walletId: sellerWallet.id,
          amount: artwork.price,
          type: TransactionType.SALE_CREDIT,
          description: `Sold "${artwork.title}" to buyer`,
          referenceId: order.id,
        },
      });

      return {
        order: {
          id: order.id,
          buyerId,
          sellerId: artwork.artistId,
          artworkId,
          amountPaid: Number(order.amountPaid),
          createdAt: order.createdAt,
          artwork: {
            id: artwork.id,
            title: artwork.title,
            imageUrl: artwork.imageUrl,
            medium: artwork.medium,
            price: Number(artwork.price),
            availability: 'SOLD' as const,
          },
          seller: {
            id: artwork.artist.id,
            name: artwork.artist.name,
            email: artwork.artist.email,
          },
        },
        newWalletBalance: Number(updatedBuyerWallet.balance),
      };
    });
  }

  /**
   * Retrieves paginated orders purchased by an authenticated buyer.
   */
  public static async getMyOrders(buyerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { buyerId },
        include: {
          artwork: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              medium: true,
              dimensions: true,
              weight: true,
              weightUnit: true,
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { buyerId } }),
    ]);

    return {
      orders: orders.map((o) => ({
        id: o.id,
        buyerId: o.buyerId,
        sellerId: o.sellerId,
        artworkId: o.artworkId,
        amountPaid: Number(o.amountPaid),
        createdAt: o.createdAt,
        artwork: o.artwork,
        seller: o.seller,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves single order by ID with access control.
   */
  public static async getOrderById(orderId: string, userId: string, userRole?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        artwork: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            medium: true,
            dimensions: true,
            weight: true,
            weightUnit: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
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
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.buyerId !== userId && order.sellerId !== userId && userRole !== 'ADMIN') {
      throw new AppError('You are not authorized to view this order', 403);
    }

    return {
      id: order.id,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      artworkId: order.artworkId,
      amountPaid: Number(order.amountPaid),
      createdAt: order.createdAt,
      artwork: order.artwork,
      seller: order.seller,
      buyer: order.buyer,
    };
  }
}
