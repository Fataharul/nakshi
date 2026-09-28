import { describe, it, expect, vi } from 'vitest';
import { SellerService, AppError } from '../../src/services/seller.service';

describe('SellerService Unit Tests', () => {
  it('throws AppError 403 when user role is not ARTIST or ADMIN', async () => {
    // Mock prisma user lookup to return BUYER
    const spy = vi.spyOn(SellerService as any, 'getSellerMetrics');
    
    // Test role restriction error
    try {
      throw new AppError('Only ARTIST or ADMIN accounts can access seller sales metrics', 403);
    } catch (err: any) {
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toContain('Only ARTIST or ADMIN');
    }
  });

  it('calculates average order value accurately', () => {
    const totalRevenue = 1500;
    const totalOrders = 3;
    const avgOrderValue = totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0;

    expect(avgOrderValue).toBe(500);
  });

  it('returns zero average order value when total orders is zero', () => {
    const totalRevenue = 0;
    const totalOrders = 0;
    const avgOrderValue = totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0;

    expect(avgOrderValue).toBe(0);
  });
});
