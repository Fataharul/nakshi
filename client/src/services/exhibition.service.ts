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

  let data: any;
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

export interface ExhibitionOrganizer {
  id: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface SampleArtwork {
  id: string;
  title: string;
  medium: string;
  imageUrl: string;
  price?: number | string;
}

export interface ExhibitionArtworkDetail {
  id: string;
  wallPosition?: number | null;
  posX?: number | null;
  posY?: number | null;
  artwork: {
    id: string;
    title: string;
    description: string;
    medium: string;
    style?: string | null;
    dimensions?: string | null;
    imageUrl: string;
    price: number | string;
    artist?: {
      id: string;
      name: string;
    };
  };
}

export interface ExhibitionTicket {
  id: string;
  ticketToken: string;
  isVip: boolean;
  purchasedAt: string;
}

export interface Exhibition {
  id: string;
  title: string;
  description: string;
  bannerUrl?: string | null;
  ticketPrice: number;
  startTime: string;
  endTime: string;
  vipStartTime?: string | null;
  vipEndTime?: string | null;
  layoutConfig?: any;
  organizer: ExhibitionOrganizer;
  artworksCount: number;
  ticketsCount: number;
  sampleArtworks?: SampleArtwork[];
  status: 'UPCOMING' | 'ACTIVE' | 'VIP_EXCLUSIVE' | 'CLOSED';
  createdAt: string;
}

export interface ExhibitionDetail extends Exhibition {
  artworks: ExhibitionArtworkDetail[];
  userTicket?: ExhibitionTicket | null;
}

export interface ExhibitionRoomData {
  exhibition: {
    id: string;
    title: string;
    description: string;
    bannerUrl?: string | null;
    organizer: ExhibitionOrganizer;
    startTime: string;
    endTime: string;
    layoutConfig?: any;
  };
  artworks: ExhibitionArtworkDetail[];
  accessPass: {
    ticketToken: string;
    isVip: boolean;
    purchasedAt: string;
  };
}

export const ExhibitionService = {
  getExhibitions: async (status?: string): Promise<Exhibition[]> => {
    const url = status && status !== 'ALL' ? `/api/exhibitions?status=${encodeURIComponent(status)}` : '/api/exhibitions';
    const data = await request<{ exhibitions: Exhibition[] }>(url, {
      method: 'GET',
    });
    return data.exhibitions;
  },

  getExhibitionById: async (id: string): Promise<ExhibitionDetail> => {
    const data = await request<{ exhibition: ExhibitionDetail }>(`/api/exhibitions/${id}`, {
      method: 'GET',
    });
    return data.exhibition;
  },

  purchaseTicket: async (exhibitionId: string, isVip: boolean = false): Promise<{ ticket: ExhibitionTicket }> => {
    return request<{ ticket: ExhibitionTicket }>(`/api/exhibitions/${exhibitionId}/ticket`, {
      method: 'POST',
      body: JSON.stringify({ isVip }),
    });
  },

  getExhibitionRoom: async (exhibitionId: string, ticketToken?: string): Promise<ExhibitionRoomData> => {
    const url = ticketToken
      ? `/api/exhibitions/${exhibitionId}/room?token=${encodeURIComponent(ticketToken)}`
      : `/api/exhibitions/${exhibitionId}/room`;
    return request<ExhibitionRoomData>(url, {
      method: 'GET',
    });
  },

  createExhibition: async (payload: any): Promise<Exhibition> => {
    const data = await request<{ exhibition: Exhibition }>('/api/exhibitions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.exhibition;
  },
};
