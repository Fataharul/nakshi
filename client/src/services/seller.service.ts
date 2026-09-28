import { SellerMetricsResponse } from '../types/seller';

const API_BASE = '/api';

export const sellerApi = {
  /**
   * Fetch authenticated artist sales metrics
   */
  async getMetrics(): Promise<SellerMetricsResponse> {
    const token = localStorage.getItem('nakshi_token');
    const response = await fetch(`${API_BASE}/seller/metrics`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch seller metrics');
    }

    return data;
  },
};
