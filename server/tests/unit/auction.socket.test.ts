import { describe, it, expect } from 'vitest';
import { broadcastAuctionUpdate, sendOutbidNotification, AuctionBidPayload, OutbidNotificationPayload } from '../../src/sockets/auction.socket';

describe('Auction Socket Broadcast Unit Tests (T-054 & T-062)', () => {
  it('broadcasts auction:updated and bid:placed events to the correct auction room with full payload', () => {
    const emittedEvents: { room: string; event: string; payload: any }[] = [];

    const mockIo: any = {
      to: (roomName: string) => {
        return {
          emit: (eventName: string, payload: any) => {
            emittedEvents.push({ room: roomName, event: eventName, payload });
          },
        };
      },
    };

    const testPayload: AuctionBidPayload = {
      auctionId: 'test-auction-uuid-1234',
      currentHighestBid: 250.0,
      highestBidder: {
        id: 'user-uuid-5678',
        name: 'Zainab Artisan',
      },
      bidId: 'bid-uuid-9999',
      timestamp: new Date().toISOString(),
    };

    broadcastAuctionUpdate(mockIo, testPayload);

    expect(emittedEvents.length).toBe(2);

    // 1. Verify room name target
    expect(emittedEvents[0].room).toBe('auction:test-auction-uuid-1234');
    expect(emittedEvents[1].room).toBe('auction:test-auction-uuid-1234');

    // 2. Verify event names
    expect(emittedEvents[0].event).toBe('auction:updated');
    expect(emittedEvents[1].event).toBe('bid:placed');

    // 3. Verify payload contents
    const payload = emittedEvents[0].payload;
    expect(payload.auctionId).toBe('test-auction-uuid-1234');
    expect(payload.currentHighestBid).toBe(250.0);
    expect(payload.highestBidder.id).toBe('user-uuid-5678');
    expect(payload.highestBidder.name).toBe('Zainab Artisan');
    expect(payload.bidId).toBe('bid-uuid-9999');
    expect(payload.timestamp).toBe(testPayload.timestamp);
  });

  it('emits notification:outbid targeted strictly to user:${recipientId} channel (T-062)', () => {
    const emittedEvents: { room: string; event: string; payload: any }[] = [];

    const mockIo: any = {
      to: (roomName: string) => {
        return {
          emit: (eventName: string, payload: any) => {
            emittedEvents.push({ room: roomName, event: eventName, payload });
          },
        };
      },
    };

    const outbidPayload: OutbidNotificationPayload = {
      recipientId: 'displaced-user-uuid-111',
      auctionId: 'auction-uuid-222',
      artworkTitle: 'Nakshi Kantha Scroll',
      newHighestBid: 550,
      message: 'You have been outbid on "Nakshi Kantha Scroll". New highest bid is 550 credits.',
      timestamp: new Date().toISOString(),
    };

    sendOutbidNotification(mockIo, outbidPayload);

    expect(emittedEvents.length).toBe(1);
    expect(emittedEvents[0].room).toBe('user:displaced-user-uuid-111');
    expect(emittedEvents[0].event).toBe('notification:outbid');
    expect(emittedEvents[0].payload.recipientId).toBe('displaced-user-uuid-111');
    expect(emittedEvents[0].payload.newHighestBid).toBe(550);
    expect(emittedEvents[0].payload.artworkTitle).toBe('Nakshi Kantha Scroll');
  });

  it('handles null or undefined io instance gracefully without crashing', () => {
    const testPayload: AuctionBidPayload = {
      auctionId: 'test-auction-uuid-1234',
      currentHighestBid: 100,
      highestBidder: { id: 'u1', name: 'Buyer' },
      bidId: 'b1',
      timestamp: new Date().toISOString(),
    };

    expect(() => broadcastAuctionUpdate(null as any, testPayload)).not.toThrow();
    expect(() => sendOutbidNotification(null as any, null as any)).not.toThrow();
  });
});

