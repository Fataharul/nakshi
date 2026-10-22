import { getStoredToken } from './auth.service';
import { CheckoutResponse, OrdersListResponse, Order } from '../types/order';

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
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.error || data.message || `HTTP ${response.status}: Request failed`,
      response.status,
      data.details
    );
  }

  return data as T;
}

export const orderApi = {
  /**
   * Purchases an artwork using authenticated user's internal credits
   */
  async checkout(artworkId: string): Promise<CheckoutResponse> {
    return request<CheckoutResponse>('/api/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({ artworkId }),
    });
  },

  /**
   * Retrieves paginated orders purchased by current authenticated buyer
   */
  async getMyOrders(page = 1, limit = 20): Promise<OrdersListResponse> {
    return request<OrdersListResponse>(`/api/orders/my-orders?page=${page}&limit=${limit}`);
  },

  /**
   * Retrieves single order by ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    return request<Order>(`/api/orders/${orderId}`);
  },
};
