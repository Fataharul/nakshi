import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import authRoutes from './routes/auth.routes';
import artworkRoutes from './routes/artwork.routes';
import sellerRoutes from './routes/seller.routes';
import auctionRoutes from './routes/auction.routes';
import walletRoutes from './routes/wallet.routes';
import orderRoutes from './routes/order.routes';
import moderationRoutes from './routes/moderation.routes';
import { AuctionService } from './services/auction.service';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const server = http.createServer(app);

import { setupSocket } from './socket';

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setupSocket(io);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local artwork uploads statically
const localUploadPaths = [
  path.resolve(process.env.UPLOAD_DIR || './uploads'),
  path.resolve('./server/uploads'),
  path.resolve(__dirname, '../../uploads'),
  path.resolve(__dirname, '../uploads'),
];
for (const uploadDir of localUploadPaths) {
  if (fs.existsSync(uploadDir)) {
    app.use('/uploads', express.static(uploadDir));
  }
}

// Health Check Endpoint (used by Playwright webServer and deployment health checks)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication & RBAC Routes
app.use('/api/auth', authRoutes);

// Artwork Routes
app.use('/api/artworks', artworkRoutes);

// Seller Sales Metrics & Analytics Routes
app.use('/api/seller', sellerRoutes);

// Auction Routes
app.use('/api/auctions', auctionRoutes);

// Wallet & Credit Transaction Routes
app.use('/api/wallet', walletRoutes);

// Fixed-Price Order & Checkout Routes
app.use('/api/orders', orderRoutes);

// Admin Moderation & Duplicate Detection Routes
app.use('/api/moderation', moderationRoutes);

// Centralized error handling
app.use(errorHandler);



const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`[Nakshi Server] running on port ${PORT}`);
    
    // Start auction expiration checker
    setInterval(() => {
      AuctionService.processEndedAuctions().catch(err => {
        console.error('[Auction Expiration Worker] Error:', err);
      });
    }, 10000); // Check every 10 seconds
  });
}

export { app, server, io };
