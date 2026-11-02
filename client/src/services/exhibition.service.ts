import { getStoredToken } from './auth.service';
import {
  Exhibition,
  ConfigureVipSchedulePayload,
  CreateExhibitionPayload,
  ExhibitionTicket,
  ExhibitionAccessResponse,
} from '../types/exhibition';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000';

export class ApiError extends Error {
  statusCode: number;
  code?: string;
  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
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
      response.status,
      data?.code
    );
  }

  return data as T;
}

export const exhibitionApi = {
  /**
   * Retrieves all public exhibitions.
   */
  async getExhibitions(): Promise<Exhibition[]> {
    const res = await request<{ exhibitions: Exhibition[] }>('/api/exhibitions');
    return res.exhibitions;
  },

  /**
   * Retrieves an exhibition by its ID.
   */
  async getExhibitionById(id: string): Promise<Exhibition> {
    const res = await request<{ exhibition: Exhibition }>(`/api/exhibitions/${id}`);
    return res.exhibition;
  },

  /**
   * Retrieves exhibitions curated by the current organizer.
   */
  async getMyExhibitions(): Promise<Exhibition[]> {
    const res = await request<{ exhibitions: Exhibition[] }>('/api/exhibitions/organizer/my');
    return res.exhibitions;
  },

  /**
   * Creates a new exhibition.
   */
  async createExhibition(payload: CreateExhibitionPayload): Promise<Exhibition> {
    const res = await request<{ exhibition: Exhibition }>('/api/exhibitions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.exhibition;
  },

  /**
   * Configures or updates the VIP viewing schedule window for an exhibition.
   */
  async configureVipSchedule(
    id: string,
    payload: ConfigureVipSchedulePayload
  ): Promise<Exhibition> {
    const res = await request<{ exhibition: Exhibition; message: string }>(
      `/api/exhibitions/${id}/vip-schedule`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
    return res.exhibition;
  },

  /**
   * Purchases an admission ticket or VIP pass for an exhibition.
   */
  async purchaseTicket(
    id: string,
    isVip: boolean = false
  ): Promise<ExhibitionTicket> {
    const res = await request<{ ticket: ExhibitionTicket; message: string }>(
      `/api/exhibitions/${id}/tickets`,
      {
        method: 'POST',
        body: JSON.stringify({ isVip }),
      }
    );
    return res.ticket;
  },

  /**
   * Retrieves user's active ticket for an exhibition.
   */
  async getMyTicket(id: string): Promise<ExhibitionTicket | null> {
    const res = await request<{ ticket: ExhibitionTicket | null }>(
      `/api/exhibitions/${id}/my-ticket`
    );
    return res.ticket;
  },

  /**
   * Enters the virtual exhibition gallery verifying timestamp-based VIP access.
   */
  async enterExhibition(
    id: string,
    options?: { ticketToken?: string; simulatedTime?: string }
  ): Promise<ExhibitionAccessResponse> {
    const res = await request<ExhibitionAccessResponse>(
      `/api/exhibitions/${id}/enter`,
      {
        method: 'POST',
        body: JSON.stringify(options || {}),
      }
    );
    return res;
  },
};
