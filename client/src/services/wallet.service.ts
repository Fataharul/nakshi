import { getStoredToken } from './auth.service';
import { TopUpResponse, TransactionLedgerResponse } from '../types/wallet';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000';

class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error || data?.message || 'A wallet request error occurred',
      response.status,
      data?.details
    );
  }

  return data as T;
}

export const walletApi = {
  /**
   * Top up dummy internal credits
   */
  async topUp(amount: number): Promise<TopUpResponse> {
    return request<TopUpResponse>('/api/wallet/top-up', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  /**
   * Get current wallet balance
   */
  async getBalance(): Promise<{ balance: number }> {
    return request<{ balance: number }>('/api/wallet/balance', {
      method: 'GET',
    });
  },

  /**
   * Get transaction ledger history
   */
  async getTransactions(page = 1, limit = 20): Promise<TransactionLedgerResponse> {
    return request<TransactionLedgerResponse>(
      `/api/wallet/transactions?page=${page}&limit=${limit}`,
      {
        method: 'GET',
      }
    );
  },
};
