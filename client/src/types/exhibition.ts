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
