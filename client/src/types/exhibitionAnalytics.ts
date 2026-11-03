export interface ExhibitionAnalytics {
  exhibitionId: string;
  title: string;
  totalVisits: number;
  averageViewingTimeSeconds: number;
  ticketsSold: number;
  totalTicketRevenue: number;
}
export interface ExhibitionVisitStart {
  visitId: string;
  enteredAt: string;
}

export interface ExhibitionVisitHeartbeat {
  durationSeconds: number;
}