export interface RawTicketData {
  id: string;
  ticketToken: string;
  buyerId: string;
  isVip: boolean;
  purchasedAt: Date | string;
  cost?: number;
  buyer?: { id: string; name: string; email?: string } | null;
}

export interface RawVisitData {
  id: string;
  userId?: string | null;
  enteredAt: Date | string;
  lastSeenAt?: Date | string;
  durationSeconds: number;
  user?: { id: string; name: string; email?: string } | null;
}

export interface RawArtworkData {
  id: string;
  price: number;
  title: string;
  medium?: string;
}

export interface RawExhibitionAnalyticsData {
  exhibition: {
    id: string;
    title: string;
    description: string;
    ticketPrice: number;
    startTime: Date | string;
    endTime: Date | string;
    vipStartTime?: Date | string | null;
    vipEndTime?: Date | string | null;
    organizer?: { id: string; name: string; email?: string } | null;
  };
  tickets: RawTicketData[];
  visits: RawVisitData[];
  artworks: RawArtworkData[];
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

/**
 * Calculates exhibition financial and attendance metrics based strictly on database records.
 * Handles zero-ticket, zero-visit, and zero-artwork division boundaries safely.
 */
export function calculateExhibitionAnalytics(
  data: RawExhibitionAnalyticsData,
  now: Date = new Date()
): CalculatedExhibitionAnalytics {
  const { exhibition, tickets, visits, artworks } = data;

  const basePrice = Number(exhibition.ticketPrice ?? 0);
  const calculatedVipPrice = Math.max(10, Math.round(basePrice * 1.5 * 100) / 100);

  // Financial calculations
  let vipRevenue = 0;
  let standardRevenue = 0;

  for (const t of tickets) {
    const cost =
      typeof t.cost === 'number'
        ? t.cost
        : t.isVip
        ? calculatedVipPrice
        : basePrice;

    if (t.isVip) {
      vipRevenue += cost;
    } else {
      standardRevenue += cost;
    }
  }

  const totalRevenue = Math.round((vipRevenue + standardRevenue) * 100) / 100;
  const totalTicketsSold = tickets.length;
  const vipTicketsCount = tickets.filter((t) => t.isVip).length;
  const standardTicketsCount = totalTicketsSold - vipTicketsCount;
  const vipTicketPercentage =
    totalTicketsSold > 0 ? Math.round((vipTicketsCount / totalTicketsSold) * 1000) / 10 : 0;
  const averageTicketPrice =
    totalTicketsSold > 0 ? Math.round((totalRevenue / totalTicketsSold) * 100) / 100 : 0;

  // Attendance & Visitor calculations
  const totalVisits = visits.length;
  const uniqueVisitorIds = new Set<string>();
  for (const v of visits) {
    if (v.userId) {
      uniqueVisitorIds.add(v.userId);
    } else {
      uniqueVisitorIds.add(v.id);
    }
  }
  const uniqueVisitors = uniqueVisitorIds.size;
  const conversionRate =
    totalTicketsSold > 0 ? Math.min(100, Math.round((uniqueVisitors / totalTicketsSold) * 1000) / 10) : 0;

  // VIP window attendance split
  const vipStartMs = exhibition.vipStartTime ? new Date(exhibition.vipStartTime).getTime() : null;
  const vipEndMs = exhibition.vipEndTime ? new Date(exhibition.vipEndTime).getTime() : null;

  let vipWindowVisits = 0;
  let generalWindowVisits = 0;

  for (const v of visits) {
    const visitTime = new Date(v.enteredAt).getTime();
    if (vipStartMs && vipEndMs && visitTime >= vipStartMs && visitTime <= vipEndMs) {
      vipWindowVisits++;
    } else {
      generalWindowVisits++;
    }
  }

  const totalDurationSeconds = visits.reduce((sum, v) => sum + (v.durationSeconds || 0), 0);
  const averageDurationSeconds =
    totalVisits > 0 ? Math.round(totalDurationSeconds / totalVisits) : 0;
  const averageVisitDurationMinutes = Math.round((averageDurationSeconds / 60) * 10) / 10;

  // Collection curation calculations
  const artworksCount = artworks.length;
  const totalCollectionValue = Math.round(
    artworks.reduce((sum, a) => sum + Number(a.price || 0), 0) * 100
  ) / 100;
  const averageArtworkPrice =
    artworksCount > 0 ? Math.round((totalCollectionValue / artworksCount) * 100) / 100 : 0;

  const partialAnalytics = {
    exhibitionId: exhibition.id,
    title: exhibition.title,
    organizerName: exhibition.organizer?.name || 'Curator',
    generatedAt: now.toISOString(),
    ticketPricing: {
      standardPrice: basePrice,
      vipPrice: calculatedVipPrice,
    },
    revenue: {
      totalRevenue,
      vipRevenue: Math.round(vipRevenue * 100) / 100,
      standardRevenue: Math.round(standardRevenue * 100) / 100,
      averageTicketPrice,
    },
    tickets: {
      totalTicketsSold,
      vipTicketsCount,
      standardTicketsCount,
      vipTicketPercentage,
    },
    attendance: {
      totalVisits,
      uniqueVisitors,
      conversionRate,
      vipWindowVisits,
      generalWindowVisits,
      totalDurationSeconds,
      averageVisitDurationMinutes,
    },
    collection: {
      artworksCount,
      totalCollectionValue,
      averageArtworkPrice,
    },
  };

  const reportOutput = generateCuratorialReportOutput(partialAnalytics);

  return {
    ...partialAnalytics,
    reportOutput,
  };
}

/**
 * Generates an executive, human-readable curatorial report output block.
 */
export function generateCuratorialReportOutput(
  analytics: Omit<CalculatedExhibitionAnalytics, 'reportOutput'>
): string {
  const line = '========================================================================';
  const subline = '------------------------------------------------------------------------';

  return [
    line,
    'NAKSHI VIRTUAL EXHIBITION CURATORIAL ANALYTICS REPORT',
    `Exhibition : ${analytics.title}`,
    `Curator    : ${analytics.organizerName}`,
    `Generated  : ${analytics.generatedAt}`,
    subline,
    'FINANCIAL PERFORMANCE & REVENUE:',
    `  • Total Ticket Revenue      : ${analytics.revenue.totalRevenue.toFixed(2)} Credits`,
    `  • VIP Vernissage Pass Gross : ${analytics.revenue.vipRevenue.toFixed(2)} Credits`,
    `  • General Admission Gross   : ${analytics.revenue.standardRevenue.toFixed(2)} Credits`,
    `  • Average Ticket Yield      : ${analytics.revenue.averageTicketPrice.toFixed(2)} Credits`,
    subline,
    'TICKETING BREAKDOWN:',
    `  • Total Passes Issued       : ${analytics.tickets.totalTicketsSold} tickets`,
    `  • VIP Early Access Passes   : ${analytics.tickets.vipTicketsCount} (${analytics.tickets.vipTicketPercentage}% share)`,
    `  • Standard Admission Tickets: ${analytics.tickets.standardTicketsCount}`,
    subline,
    'AUDIENCE ENGAGEMENT & ATTENDANCE:',
    `  • Gallery Wall Entries      : ${analytics.attendance.totalVisits} visits`,
    `  • Unique Attendees          : ${analytics.attendance.uniqueVisitors} visitors`,
    `  • Pass Activation Rate      : ${analytics.attendance.conversionRate}%`,
    `  • VIP Window Vernissage     : ${analytics.attendance.vipWindowVisits} entries`,
    `  • Public Hours Attendance   : ${analytics.attendance.generalWindowVisits} entries`,
    `  • Average Visitor Dwell     : ${analytics.attendance.averageVisitDurationMinutes} minutes`,
    subline,
    'CURATED GALLERY COLLECTION:',
    `  • Artworks On Exhibit       : ${analytics.collection.artworksCount} curated pieces`,
    `  • Total Collection Value    : ${analytics.collection.totalCollectionValue.toFixed(2)} Credits`,
    `  • Average Artifact Price    : ${analytics.collection.averageArtworkPrice.toFixed(2)} Credits`,
    line,
  ].join('\n');
}
