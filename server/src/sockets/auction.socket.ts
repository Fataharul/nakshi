import { Server as SocketIOServer, Socket } from 'socket.io';

export interface HighestBidderInfo {
  id: string;
  name: string;
}

export interface AuctionBidPayload {
  auctionId: string;
  currentHighestBid: number;
  highestBidder: HighestBidderInfo;
  bidId: string;
  timestamp: string;
}

/**
 * Initialize Socket.IO connection event listeners for live auction rooms
 */
export function setupAuctionSockets(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    // Client joins an auction room to receive live updates
    socket.on('join_auction', (auctionId: string) => {
      if (auctionId) {
        socket.join(`auction:${auctionId}`);
      }
    });

    // Client leaves an auction room
    socket.on('leave_auction', (auctionId: string) => {
      if (auctionId) {
        socket.leave(`auction:${auctionId}`);
      }
    });
  });
}

/**
 * Broadcast updated auction state and bid event to all connected clients in the auction room
 */
export function broadcastAuctionUpdate(io: SocketIOServer, payload: AuctionBidPayload) {
  if (!io) return;
  const roomName = `auction:${payload.auctionId}`;
  io.to(roomName).emit('auction:updated', payload);
  io.to(roomName).emit('bid:placed', payload);
}
