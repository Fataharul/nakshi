export interface OrderItemArtwork {
  id: string;
  title: string;
  imageUrl: string;
  medium: string;
  dimensions?: string | null;
  weight?: number | null;
  weightUnit?: string | null;
  price?: number;
  availability?: 'AVAILABLE' | 'RESERVED' | 'SOLD';
}

export interface OrderItemUser {
  id: string;
  name: string;
  email: string;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  artworkId: string;
  amountPaid: number;
  createdAt: string;
  artwork: OrderItemArtwork;
  seller: OrderItemUser;
  buyer?: OrderItemUser;
}

export interface CheckoutResponse {
  message: string;
  order: Order;
  newWalletBalance: number;
}

export interface OrdersListResponse {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
