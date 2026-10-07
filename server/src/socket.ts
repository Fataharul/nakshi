import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthService } from './services/auth.service';

export const setupSocket = (io: SocketIOServer) => {
  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const authHeader = socket.handshake.auth.token || socket.handshake.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const payload = AuthService.verifyToken(token);
        // Attach user info to socket for later use
        (socket as any).user = payload;
      } catch (err) {
        // We do not reject connection here because public users can view auctions without auth.
        // We just don't attach user info.
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    
    // Join personal room if authenticated
    if (user) {
      socket.join(`user:${user.id}`);
    }

    // Join an auction room
    socket.on('auction:join', (auctionId: string) => {
      socket.join(`auction:${auctionId}`);
    });

    // Leave an auction room
    socket.on('auction:leave', (auctionId: string) => {
      socket.leave(`auction:${auctionId}`);
    });

    socket.on('disconnect', () => {
      // Automatic cleanup handled by socket.io
    });
  });
};
