import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import artworkRoutes from './routes/artwork.routes';
import sellerRoutes from './routes/seller.routes';
import auctionRoutes from './routes/auction.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Live Auction & Bidding Routes
app.use('/api/auctions', auctionRoutes);

// Centralized error handling
app.use(errorHandler);


const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`[Nakshi Server] running on port ${PORT}`);
  });
}

export { app, server, io };
