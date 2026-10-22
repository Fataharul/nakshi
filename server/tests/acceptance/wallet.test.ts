import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../../src/server';
import { prisma } from '../../src/config/prisma';

describe('Wallet Top-Up & Transaction Ledger Acceptance Tests', () => {
  let serverInstance: http.Server;
  let baseUrl: string;
  const uniqueId = Date.now();
  let buyerToken: string;
  let buyerId: string;

  const testUser = {
    name: `Wallet Buyer ${uniqueId}`,
    email: `wallet_buyer_${uniqueId}@nakshi.test`,
    password: 'Password123!',
    role: 'BUYER',
  };

  beforeAll(async () => {
    // Start test server on dynamic open port
    await new Promise<void>((resolve) => {
      serverInstance = app.listen(0, () => {
        const address = serverInstance.address() as AddressInfo;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });

    // Register user
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    const data = (await res.json()) as any;
    buyerToken = data.token;
    buyerId = data.user.id;
  });

  afterAll(async () => {
    // Cleanup created data
    if (buyerId) {
      await prisma.user.delete({ where: { id: buyerId } }).catch(() => {});
    }
    // Close server
    await new Promise<void>((resolve) => serverInstance.close(() => resolve()));
  });

  describe('GET /api/wallet/balance', () => {
    it('rejects unauthenticated request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/wallet/balance`);
      expect(res.status).toBe(401);
    });

    it('returns initial 0 balance for newly registered user', async () => {
      const res = await fetch(`${baseUrl}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.balance).toBe(0);
    });
  });

  describe('POST /api/wallet/top-up', () => {
    it('rejects unauthenticated request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/wallet/top-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 500 }),
      });
      expect(res.status).toBe(401);
    });

    it('rejects non-positive top-up amount with 400', async () => {
      const res = await fetch(`${baseUrl}/api/wallet/top-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ amount: -100 }),
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toBeDefined();
    });

    it('rejects top-up exceeding 100,000 maximum constraint with 400', async () => {
      const res = await fetch(`${baseUrl}/api/wallet/top-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ amount: 150000 }),
      });
      expect(res.status).toBe(400);
    });

    it('successfully credits wallet balance and logs CreditTransaction', async () => {
      const topUpAmount = 500.0;
      const res = await fetch(`${baseUrl}/api/wallet/top-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ amount: topUpAmount }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.message).toBe('Credits topped up successfully');
      expect(data.balance).toBe(500);
      expect(data.transaction).toBeDefined();
      expect(data.transaction.type).toBe('TOP_UP');
      expect(data.transaction.amount).toBe(500);
      expect(data.transaction.referenceId).toMatch(/^TOPUP-/);
    });

    it('accumulates balance correctly on subsequent top-ups', async () => {
      const res = await fetch(`${baseUrl}/api/wallet/top-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ amount: 250.5 }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.balance).toBe(750.5);
    });
  });

  describe('GET /api/wallet/transactions', () => {
    it('returns chronological transaction ledger history with pagination', async () => {
      const res = await fetch(`${baseUrl}/api/wallet/transactions?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.balance).toBe(750.5);
      expect(Array.isArray(data.transactions)).toBe(true);
      expect(data.transactions.length).toBe(2);
      expect(data.transactions[0].type).toBe('TOP_UP');
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });
  });
});
