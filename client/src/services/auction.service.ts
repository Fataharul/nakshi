import { getStoredToken } from './auth.service';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000';

class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error || data?.message || 'An unexpected error occurred',
      response.status
    );
  }

  return data as T;
}

export interface CreateAuctionPayload {
  artworkId: string;
  startingBid: number;
  minIncrement: number;
  startTime: string;
  endTime: string;
}

export interface AuctionResponse {
  id: string;
  artworkId: string;
  startingBid: number;
  currentHighestBid: number | null;
  minIncrement: number;
  startTime: string;
  endTime: string;
  status: 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  artwork?: {
    id: string;
    title: string;
    medium: string;
    imageUrl: string;
  };
}

export const AuctionService = {
  createAuction: async (payload: CreateAuctionPayload): Promise<AuctionResponse> => {
    const data = await request<{ auction: AuctionResponse }>('/api/auctions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.auction;
  },

  getMyAuctions: async (): Promise<AuctionResponse[]> => {
    const data = await request<{ auctions: AuctionResponse[] }>('/api/auctions/my', {
      method: 'GET',
    });
    return data.auctions;
  },

  placeBid: async (auctionId: string, amount: number): Promise<any> => {
    const data = await request<{ bid: any }>(`/api/auctions/${auctionId}/bid`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    return data.bid;
  },
};
