import { prisma } from '../config/prisma';
import { AppError } from './auth.service';
import { TransactionType, Prisma } from '@prisma/client';

export class WalletService {
  /**
   * Top up dummy internal credits into user's wallet
   */
  public static async topUp(userId: string, amount: number) {
    if (amount <= 0) {
      throw new AppError('Top-up amount must be greater than zero', 400);
    }

    const decimalAmount = new Prisma.Decimal(amount.toFixed(2));

    const result = await prisma.$transaction(async (tx) => {
      // Find or create wallet for user
      let wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId,
            balance: new Prisma.Decimal(0.0),
          },
        });
      }

      // Increment balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: decimalAmount,
          },
        },
      });

      // Generate reference ID
      const referenceId = `TOPUP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // Create transaction log
      const transaction = await tx.creditTransaction.create({
        data: {
          walletId: updatedWallet.id,
          amount: decimalAmount,
          type: TransactionType.TOP_UP,
          description: `Simulated dummy credit top-up (+${decimalAmount.toFixed(2)} Credits)`,
          referenceId,
        },
      });

      return {
        wallet: updatedWallet,
        transaction,
      };
    });

    return {
      balance: Number(result.wallet.balance),
      transaction: {
        id: result.transaction.id,
        amount: Number(result.transaction.amount),
        type: result.transaction.type,
        description: result.transaction.description,
        referenceId: result.transaction.referenceId,
        createdAt: result.transaction.createdAt,
      },
    };
  }

  /**
   * Get user wallet balance
   */
  public static async getBalance(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      // Lazy creation if somehow not created on register
      const newWallet = await prisma.wallet.create({
        data: {
          userId,
          balance: new Prisma.Decimal(0.0),
        },
      });
      return { balance: Number(newWallet.balance) };
    }

    return { balance: Number(wallet.balance) };
  }

  /**
   * Get transaction ledger history with pagination
   */
  public static async getTransactions(userId: string, page = 1, limit = 20) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return {
        balance: 0,
        transactions: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.creditTransaction.count({
        where: { walletId: wallet.id },
      }),
    ]);

    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      type: t.type,
      description: t.description,
      referenceId: t.referenceId,
      createdAt: t.createdAt,
    }));

    return {
      balance: Number(wallet.balance),
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
