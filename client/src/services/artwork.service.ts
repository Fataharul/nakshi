import { getStoredToken } from './auth.service';
import {
  Artwork,
  CreateArtworkPayload,
  UpdateArtworkPayload,
  ArtworkFilterParams,
  StorefrontResponse,
} from '../types/artwork';

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
    data = {};
  }

  if (!response.ok) {
    throw new ApiError(data.error || 'An unexpected error occurred', response.status, data.details);
  }

  return data as T;
}

export const artworkApi = {
  async getArtworks(params: ArtworkFilterParams = {}): Promise<{ artworks: Artwork[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params.medium && params.medium !== 'ALL') query.append('medium', params.medium);
    if (params.style && params.style !== 'ALL') query.append('style', params.style);
    if (params.search) query.append('search', params.search);
    if (params.availability) query.append('availability', params.availability);
    if (params.minPrice !== undefined) query.append('minPrice', String(params.minPrice));
    if (params.maxPrice !== undefined) query.append('maxPrice', String(params.maxPrice));
    if (params.page !== undefined) query.append('page', String(params.page));
    if (params.limit !== undefined) query.append('limit', String(params.limit));

    const queryString = query.toString();
    const endpoint = `/api/artworks${queryString ? `?${queryString}` : ''}`;
    return request<{ artworks: Artwork[]; pagination: any }>(endpoint, {
      method: 'GET',
    });
  },

  async createArtwork(payload: CreateArtworkPayload): Promise<Artwork> {
    const data = await request<{ artwork: Artwork }>('/api/artworks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.artwork;
  },

  async updateArtwork(id: string, payload: UpdateArtworkPayload): Promise<Artwork> {
    const data = await request<{ artwork: Artwork }>(`/api/artworks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data.artwork;
  },

  async deleteArtwork(id: string): Promise<void> {
    await request<{ message: string }>(`/api/artworks/${id}`, {
      method: 'DELETE',
    });
  },

  async getMyArtworks(): Promise<Artwork[]> {
    const data = await request<{ artworks: Artwork[] }>('/api/artworks/my-artworks', {
      method: 'GET',
    });
    return data.artworks;
  },

  async getArtworkById(id: string): Promise<Artwork> {
    const data = await request<{ artwork: Artwork }>(`/api/artworks/${id}`, {
      method: 'GET',
    });
    return data.artwork;
  },

  async getStorefront(artistId: string): Promise<StorefrontResponse> {
    return request<StorefrontResponse>(`/api/artworks/storefront/${artistId}`, {
      method: 'GET',
    });
  },

  async uploadImage(file: File): Promise<{ imageUrl: string; key: string }> {
    const token = getStoredToken();
    const formData = new FormData();
    formData.append('image', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/artworks/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    let data: any;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new ApiError(data.error || 'Failed to upload artwork image', response.status, data.details);
    }

    return data;
  },
};
