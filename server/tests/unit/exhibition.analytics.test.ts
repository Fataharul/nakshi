import { describe, it, expect } from 'vitest';
import {
  calculateExhibitionAnalytics,
  generateCuratorialReportOutput,
  RawExhibitionAnalyticsData,
} from '../../src/utils/exhibition.analytics';

describe('Exhibition Analytics Calculation Engine & Report Output', () => {
  const baseExhibition = {
    id: 'exhibition-analytics-001',
    title: 'Jamdani Masterpieces Vernissage',
    description: 'A curated virtual retrospective of handwoven Jamdani heritage.',
    ticketPrice: 20,
    startTime: '2026-12-05T10:00:00.000Z',
    endTime: '2026-12-20T18:00:00.000Z',
    vipStartTime: '2026-12-03T10:00:00.000Z',
    vipEndTime: '2026-12-05T09:59:59.000Z',
    organizer: {
      id: 'organizer-001',
      name: 'Begum Rokeya Gallery',
      email: 'curator@nakshi.org',
    },
  };

  describe('Zero-Division & Empty Activity Safety', () => {
    it('handles exhibitions with 0 tickets, 0 visits, and 0 artworks safely without NaN', () => {
      const emptyData: RawExhibitionAnalyticsData = {
        exhibition: baseExhibition,
        tickets: [],
        visits: [],
        artworks: [],
      };

      const result = calculateExhibitionAnalytics(emptyData, new Date('2026-12-01T00:00:00.000Z'));

      expect(result.exhibitionId).toBe('exhibition-analytics-001');
      expect(result.organizerName).toBe('Begum Rokeya Gallery');

      // Financials
      expect(result.revenue.totalRevenue).toBe(0);
      expect(result.revenue.vipRevenue).toBe(0);
      expect(result.revenue.standardRevenue).toBe(0);
      expect(result.revenue.averageTicketPrice).toBe(0);

      // Ticketing
      expect(result.tickets.totalTicketsSold).toBe(0);
      expect(result.tickets.vipTicketsCount).toBe(0);
      expect(result.tickets.standardTicketsCount).toBe(0);
      expect(result.tickets.vipTicketPercentage).toBe(0);

      // Attendance
      expect(result.attendance.totalVisits).toBe(0);
      expect(result.attendance.uniqueVisitors).toBe(0);
      expect(result.attendance.conversionRate).toBe(0);
      expect(result.attendance.vipWindowVisits).toBe(0);
      expect(result.attendance.generalWindowVisits).toBe(0);
      expect(result.attendance.averageVisitDurationMinutes).toBe(0);

      // Collection
      expect(result.collection.artworksCount).toBe(0);
      expect(result.collection.totalCollectionValue).toBe(0);
      expect(result.collection.averageArtworkPrice).toBe(0);

      // Report output string must contain no NaNs
      expect(result.reportOutput).toBeDefined();
      expect(result.reportOutput).not.toContain('NaN');
      expect(result.reportOutput).toContain('NAKSHI VIRTUAL EXHIBITION CURATORIAL ANALYTICS REPORT');
      expect(result.reportOutput).toContain('0.00 Credits');
    });
  });

  describe('Financial Revenue Calculations', () => {
    it('accurately computes VIP and standard revenue with fallback pricing calculation', () => {
      const data: RawExhibitionAnalyticsData = {
        exhibition: {
          ...baseExhibition,
          ticketPrice: 40, // Base standard = 40, calculated VIP = 40 * 1.5 = 60
        },
        tickets: [
          {
            id: 't-1',
            ticketToken: 'NK-EXH-2026-STD1',
            buyerId: 'user-1',
            isVip: false,
            purchasedAt: '2026-12-01T10:00:00.000Z',
          },
          {
            id: 't-2',
            ticketToken: 'NK-EXH-2026-STD2',
            buyerId: 'user-2',
            isVip: false,
            purchasedAt: '2026-12-01T11:00:00.000Z',
          },
          {
            id: 't-3',
            ticketToken: 'NK-EXH-2026-VIP1',
            buyerId: 'user-3',
            isVip: true,
            purchasedAt: '2026-12-01T12:00:00.000Z',
          },
        ],
        visits: [],
        artworks: [],
      };

      const result = calculateExhibitionAnalytics(data);

      expect(result.ticketPricing.standardPrice).toBe(40);
      expect(result.ticketPricing.vipPrice).toBe(60);

      expect(result.tickets.totalTicketsSold).toBe(3);
      expect(result.tickets.standardTicketsCount).toBe(2);
      expect(result.tickets.vipTicketsCount).toBe(1);
      expect(result.tickets.vipTicketPercentage).toBe(33.3);

      expect(result.revenue.standardRevenue).toBe(80); // 2 * 40
      expect(result.revenue.vipRevenue).toBe(60); // 1 * 60
      expect(result.revenue.totalRevenue).toBe(140);
      expect(result.revenue.averageTicketPrice).toBe(46.67);
    });

    it('honors explicitly recorded ticket costs when present', () => {
      const data: RawExhibitionAnalyticsData = {
        exhibition: baseExhibition,
        tickets: [
          {
            id: 't-custom-1',
            ticketToken: 'NK-EXH-2026-VIPX',
            buyerId: 'user-1',
            isVip: true,
            cost: 75.5,
            purchasedAt: '2026-12-01T10:00:00.000Z',
          },
          {
            id: 't-custom-2',
            ticketToken: 'NK-EXH-2026-STDX',
            buyerId: 'user-2',
            isVip: false,
            cost: 15.25,
            purchasedAt: '2026-12-01T10:00:00.000Z',
          },
        ],
        visits: [],
        artworks: [],
      };

      const result = calculateExhibitionAnalytics(data);

      expect(result.revenue.vipRevenue).toBe(75.5);
      expect(result.revenue.standardRevenue).toBe(15.25);
      expect(result.revenue.totalRevenue).toBe(90.75);
      expect(result.revenue.averageTicketPrice).toBe(45.38);
    });
  });

  describe('Audience Attendance & Dwell Metrics', () => {
    it('accurately tracks visits, unique visitors, dwell time, and VIP vs Public traffic split', () => {
      const data: RawExhibitionAnalyticsData = {
        exhibition: baseExhibition, // VIP: Dec 03 10:00 to Dec 05 09:59:59, Public: Dec 05 10:00 to Dec 20 18:00
        tickets: [
          { id: 't-1', ticketToken: 'TK-1', buyerId: 'user-a', isVip: true, purchasedAt: '2026-12-01T00:00:00Z' },
          { id: 't-2', ticketToken: 'TK-2', buyerId: 'user-b', isVip: true, purchasedAt: '2026-12-01T00:00:00Z' },
          { id: 't-3', ticketToken: 'TK-3', buyerId: 'user-c', isVip: false, purchasedAt: '2026-12-01T00:00:00Z' },
          { id: 't-4', ticketToken: 'TK-4', buyerId: 'user-d', isVip: false, purchasedAt: '2026-12-01T00:00:00Z' },
        ],
        visits: [
          // VIP window visits (Dec 4)
          {
            id: 'v-1',
            userId: 'user-a',
            enteredAt: '2026-12-04T11:00:00.000Z',
            durationSeconds: 1800, // 30 mins
          },
          {
            id: 'v-2',
            userId: 'user-a', // repeat visit by user-a
            enteredAt: '2026-12-04T15:00:00.000Z',
            durationSeconds: 1200, // 20 mins
          },
          {
            id: 'v-3',
            userId: 'user-b',
            enteredAt: '2026-12-04T12:00:00.000Z',
            durationSeconds: 3600, // 60 mins
          },
          // Public hours visit (Dec 6)
          {
            id: 'v-4',
            userId: 'user-c',
            enteredAt: '2026-12-06T14:00:00.000Z',
            durationSeconds: 2400, // 40 mins
          },
        ],
        artworks: [],
      };

      const result = calculateExhibitionAnalytics(data);

      expect(result.attendance.totalVisits).toBe(4);
      // Unique visitors: user-a, user-b, user-c = 3
      expect(result.attendance.uniqueVisitors).toBe(3);
      // Conversion rate: 3 unique visitors / 4 tickets = 75%
      expect(result.attendance.conversionRate).toBe(75);

      // VIP window vs Public hours
      expect(result.attendance.vipWindowVisits).toBe(3);
      expect(result.attendance.generalWindowVisits).toBe(1);

      // Average dwell: (1800 + 1200 + 3600 + 2400) = 9000s / 4 visits = 2250s = 37.5 minutes
      expect(result.attendance.totalDurationSeconds).toBe(9000);
      expect(result.attendance.averageVisitDurationMinutes).toBe(37.5);
    });
  });

  describe('Curated Collection Valuation', () => {
    it('aggregates total artwork valuation and computes average artifact price', () => {
      const data: RawExhibitionAnalyticsData = {
        exhibition: baseExhibition,
        tickets: [],
        visits: [],
        artworks: [
          { id: 'art-1', title: 'Royal Nakshi Kantha', price: 1200, medium: 'Textile' },
          { id: 'art-2', title: 'Terracotta Folk Motif', price: 450, medium: 'Clay' },
          { id: 'art-3', title: 'Dhaka Muslin Veil', price: 2350, medium: 'Cotton Silk' },
        ],
      };

      const result = calculateExhibitionAnalytics(data);

      expect(result.collection.artworksCount).toBe(3);
      expect(result.collection.totalCollectionValue).toBe(4000); // 1200 + 450 + 2350
      expect(result.collection.averageArtworkPrice).toBe(1333.33); // 4000 / 3
    });
  });

  describe('Curatorial Report Output Generator', () => {
    it('renders a formatted executive text report matching all performance metrics', () => {
      const mockAnalytics = {
        exhibitionId: 'exh-rep-1',
        title: 'Shonargaon Heritage Showcase',
        organizerName: 'Zainul Abedin Heritage Trust',
        generatedAt: '2026-11-02T20:00:00.000Z',
        ticketPricing: {
          standardPrice: 25,
          vipPrice: 37.5,
        },
        revenue: {
          totalRevenue: 625,
          vipRevenue: 375,
          standardRevenue: 250,
          averageTicketPrice: 31.25,
        },
        tickets: {
          totalTicketsSold: 20,
          vipTicketsCount: 10,
          standardTicketsCount: 10,
          vipTicketPercentage: 50,
        },
        attendance: {
          totalVisits: 35,
          uniqueVisitors: 18,
          conversionRate: 90,
          vipWindowVisits: 14,
          generalWindowVisits: 21,
          totalDurationSeconds: 73500,
          averageVisitDurationMinutes: 35,
        },
        collection: {
          artworksCount: 8,
          totalCollectionValue: 15400,
          averageArtworkPrice: 1925,
        },
      };

      const report = generateCuratorialReportOutput(mockAnalytics);

      expect(report).toContain('NAKSHI VIRTUAL EXHIBITION CURATORIAL ANALYTICS REPORT');
      expect(report).toContain('Exhibition : Shonargaon Heritage Showcase');
      expect(report).toContain('Curator    : Zainul Abedin Heritage Trust');
      expect(report).toContain('Generated  : 2026-11-02T20:00:00.000Z');

      // Financials
      expect(report).toContain('Total Ticket Revenue      : 625.00 Credits');
      expect(report).toContain('VIP Vernissage Pass Gross : 375.00 Credits');
      expect(report).toContain('General Admission Gross   : 250.00 Credits');
      expect(report).toContain('Average Ticket Yield      : 31.25 Credits');

      // Ticketing
      expect(report).toContain('Total Passes Issued       : 20 tickets');
      expect(report).toContain('VIP Early Access Passes   : 10 (50% share)');
      expect(report).toContain('Standard Admission Tickets: 10');

      // Attendance
      expect(report).toContain('Gallery Wall Entries      : 35 visits');
      expect(report).toContain('Unique Attendees          : 18 visitors');
      expect(report).toContain('Pass Activation Rate      : 90%');
      expect(report).toContain('VIP Window Vernissage     : 14 entries');
      expect(report).toContain('Public Hours Attendance   : 21 entries');
      expect(report).toContain('Average Visitor Dwell     : 35 minutes');

      // Collection
      expect(report).toContain('Artworks On Exhibit       : 8 curated pieces');
      expect(report).toContain('Total Collection Value    : 15400.00 Credits');
      expect(report).toContain('Average Artifact Price    : 1925.00 Credits');
    });
  });
});
