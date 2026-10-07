import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect(token?: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(API_URL, {
      auth: token ? { token } : {},
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinAuctionRoom(auctionId: string) {
    if (this.socket) {
      this.socket.emit('auction:join', auctionId);
    }
  }

  leaveAuctionRoom(auctionId: string) {
    if (this.socket) {
      this.socket.emit('auction:leave', auctionId);
    }
  }

  onNewBid(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('auction:new_bid', callback);
    }
  }

  offNewBid(callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('auction:new_bid', callback);
      } else {
        this.socket.off('auction:new_bid');
      }
    }
  }

  onOutbid(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('auction:outbid', callback);
    }
  }

  offOutbid(callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('auction:outbid', callback);
      } else {
        this.socket.off('auction:outbid');
      }
    }
  }

  onAuctionEnded(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('auction:ended', callback);
    }
  }

  offAuctionEnded(callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('auction:ended', callback);
      } else {
        this.socket.off('auction:ended');
      }
    }
  }
}

export const socketService = new SocketService();
