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
    availability?: string;
    artist?: { id: string; name: string };
  };
  bidCount?: number;
}

// T-049: Bid submission types
export interface AuctionBid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName?: string;
  amount: number;
  createdAt: string;
}

export interface AuctionDetail extends AuctionResponse {
  bids: AuctionBid[];
}

export interface PlaceBidResult {
  message: string;
  bid: AuctionBid;
  auction: {
    id: string;
    status: AuctionResponse['status'];
    startingBid: number;
    minIncrement: number;
    endTime: string;
    highestBid: number;
  };
}
/**
 * Auction API client.
 * - createAuction / getMyAuctions: artist-only endpoints
 * - getActiveAuctions / getAuction: public endpoints
 * - placeBid: buyer-only endpoint (T-049); the server re-validates every bid
 */
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
    // Public: active and upcoming auctions
  getActiveAuctions: async (): Promise<AuctionResponse[]> => {
    const data = await request<{ auctions: AuctionResponse[] }>('/api/auctions/active', {
      method: 'GET',
    });
    return data.auctions;
  },

  // Public: one auction with its recent bids
  getAuction: async (auctionId: string): Promise<AuctionDetail> => {
    const data = await request<{ auction: AuctionDetail }>(`/api/auctions/${auctionId}`, {
      method: 'GET',
    });
    return data.auction;
  },

  // T-049: submit a bid (BUYER only)
  placeBid: async (auctionId: string, amount: number): Promise<PlaceBidResult> => {
    return request<PlaceBidResult>(`/api/auctions/${auctionId}/bids`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  

  getAuctionById: async (auctionId: string): Promise<AuctionResponse> => {
    const data = await request<{ auction: AuctionResponse }>(`/api/auctions/${auctionId}`, {
      method: 'GET',
    });
    return data.auction;
  },
};
