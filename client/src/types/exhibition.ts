export type VipScheduleStatus = 'NOT_CONFIGURED' | 'SCHEDULED' | 'ACTIVE' | 'CONCLUDED';

export interface Exhibition {
  id: string;
  title: string;
  description: string;
  bannerUrl: string | null;
  ticketPrice: number;
  startTime: string;
  endTime: string;
  vipStartTime: string | null;
  vipEndTime: string | null;
  isVipEnabled: boolean;
  vipStatus: VipScheduleStatus;
  vipDuration: string | null;
  organizerId: string;
  organizer?: {
    id: string;
    name: string;
    email?: string;
  };
  artworksCount?: number;
  ticketsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigureVipSchedulePayload {
  isVipEnabled: boolean;
  vipStartTime: string | null;
  vipEndTime: string | null;
}

export interface CreateExhibitionPayload {
  title: string;
  description: string;
  bannerUrl?: string;
  ticketPrice: number;
  startTime: string;
  endTime: string;
  isVipEnabled?: boolean;
  vipStartTime?: string | null;
  vipEndTime?: string | null;
}

export interface ExhibitionTicket {
  id: string;
  ticketToken: string;
  exhibitionId: string;
  buyerId: string;
  isVip: boolean;
  cost?: number;
  purchasedAt: string;
}

export interface ExhibitionArtworkBrief {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  medium: string;
  wallPosition?: number | null;
  posX?: number | null;
  posY?: number | null;
}

export interface ExhibitionAccessResponse {
  allowed: boolean;
  accessType?: 'ORGANIZER' | 'VIP' | 'GENERAL';
  evaluationTimestamp: string;
  exhibition: Exhibition;
  artworks: ExhibitionArtworkBrief[];
  ticket: ExhibitionTicket | null;
}

export interface CalculatedExhibitionAnalytics {
  exhibitionId: string;
  title: string;
  organizerName: string;
  generatedAt: string;
  ticketPricing: {
    standardPrice: number;
    vipPrice: number;
  };
  revenue: {
    totalRevenue: number;
    vipRevenue: number;
    standardRevenue: number;
    averageTicketPrice: number;
  };
  tickets: {
    totalTicketsSold: number;
    vipTicketsCount: number;
    standardTicketsCount: number;
    vipTicketPercentage: number;
  };
  attendance: {
    totalVisits: number;
    uniqueVisitors: number;
    conversionRate: number;
    vipWindowVisits: number;
    generalWindowVisits: number;
    totalDurationSeconds: number;
    averageVisitDurationMinutes: number;
  };
  collection: {
    artworksCount: number;
    totalCollectionValue: number;
    averageArtworkPrice: number;
  };
  reportOutput: string;
}
