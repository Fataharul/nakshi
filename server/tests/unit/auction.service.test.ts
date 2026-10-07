import { describe, it, expect } from 'vitest';
import { AuctionService } from '../../src/services/auction.service';

describe('AuctionService Unit Tests', () => {
  describe('formatAuction', () => {
    it('correctly calculates minNextBid as startingBid when no bids exist', () => {
      const mockRawAuction = {
        id: 'auction-123',
        artworkId: 'artwork-456',
        startingBid: '100.00',
        currentHighestBid: null,
        minIncrement: '10.00',
        startTime: new Date('2026-10-01T10:00:00Z'),
        endTime: new Date('2026-10-01T12:00:00Z'),
        status: 'ACTIVE',
        winnerId: null,
        artwork: {
          id: 'artwork-456',
          title: 'Terracotta Vase',
          description: 'Earthen craft',
          medium: 'Terracotta Clay',
          imageUrl: 'https://example.com/vase.jpg',
          price: '150.00',
          artistId: 'artist-789',
          artist: { id: 'artist-789', name: 'Artisan' },
        },
        bids: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const formatted = AuctionService.formatAuction(mockRawAuction);

      expect(formatted.startingBid).toBe(100);
      expect(formatted.currentHighestBid).toBeNull();
      expect(formatted.minIncrement).toBe(10);
      expect(formatted.minNextBid).toBe(100);
      expect(formatted.status).toBe('ACTIVE');
      expect(formatted.artwork?.title).toBe('Terracotta Vase');
    });

    it('correctly calculates minNextBid as currentHighestBid + minIncrement when bids exist', () => {
      const mockRawAuction = {
        id: 'auction-124',
        artworkId: 'artwork-456',
        startingBid: '100.00',
        currentHighestBid: '120.00',
        minIncrement: '15.00',
        startTime: new Date('2026-10-01T10:00:00Z'),
        endTime: new Date('2026-10-01T12:00:00Z'),
        status: 'ACTIVE',
        winnerId: null,
        artwork: {
          id: 'artwork-456',
          title: 'Jamdani Tapestry',
          description: 'Heritage weave',
          medium: 'Handloom Jamdani',
          imageUrl: 'https://example.com/jamdani.jpg',
          price: '200.00',
          artistId: 'artist-789',
        },
        bids: [
          {
            id: 'bid-1',
            auctionId: 'auction-124',
            bidderId: 'buyer-999',
            amount: '120.00',
            createdAt: new Date(),
            bidder: { id: 'buyer-999', name: 'Collector' },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const formatted = AuctionService.formatAuction(mockRawAuction);

      expect(formatted.startingBid).toBe(100);
      expect(formatted.currentHighestBid).toBe(120);
      expect(formatted.minIncrement).toBe(15);
      expect(formatted.minNextBid).toBe(135);
      expect(formatted.bids?.length).toBe(1);
      expect(formatted.bids?.[0].amount).toBe(120);
    });
  });
});
