export interface SellerMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  activeListings: number;
  pendingArtworks: number;
  soldArtworks: number;
  totalArtworks: number;
}

export interface RecentSale {
  id: string;
  artworkId: string;
  artworkTitle: string;
  artworkImageUrl: string;
  artworkMedium: string;
  buyerName: string;
  buyerEmail: string;
  amountPaid: number;
  createdAt: string;
}

export interface SellerMetricsResponse {
  seller: {
    id: string;
    name: string;
    email: string;
  };
  metrics: SellerMetrics;
  recentSales: RecentSale[];
}
