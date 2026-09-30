# Architecture Design: Nakshi

## 1. System Overview

Nakshi is an art and crafts marketplace, live auction, and virtual exhibition platform celebrating Bangladeshi heritage. The system is designed as a **3-Tier Layered Architecture** with an **Asynchronous Worker Queue** for heavy image perceptual hashing and a **Real-Time WebSocket Layer** for synchronized live auctions.

The architecture is built for **zero external API costs**, supporting free-tier cloud deployment on **Vercel** (frontend), **Render** (Node.js API + Socket.IO), and **Supabase** (managed PostgreSQL).

```
┌─────────────────────────────────────────────────────────────┐
│                    1. Presentation Layer                    │
│   • React + Vite SPA (Client on Vercel)                     │
│   • Express Routes & Controllers (REST API on Render)       │
│   • Socket.IO Handlers (Real-time live auction rooms)       │
│   • Middlewares (JWT Auth, RBAC Policy Guards, Multer)      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               2. Service Layer (Business Logic)             │
│   • AuthService: Passwords (bcrypt), JWT, RBAC              │
│   • CreditService: Atomic balance checks & ledger audit log │
│   • ArtworkService: Inventory locking, storefront listings  │
│   • AuctionService: Bids, increments, timers, settlement    │
│   • ExhibitionService: Ticket tokens, VIP windows, layouts  │
│   • SimilarityService: Sharp 64-bit dHash, Hamming distance │
│   • AnalyticsService: Persisted events & role-based stats   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│   3. Data Persistence Layer  │ │4. Asynchronous Queue Worker│
│   • PostgreSQL (Supabase)    │ │ • Non-blocking background  │
│   • Prisma ORM Client        │ │   worker                   │
│   • ACID Transactions        │ │ • Sharp perceptual hashing │
│   • Indexed FKs & Searches   │ │ • Moderation status updates│
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 2. Layer Responsibilities

### 2.1 Presentation / Transport Layer (`server/src/controllers/`, `server/src/routes/`, `server/src/sockets/`)
- Thin controllers responsible only for HTTP request parsing, input validation, and calling domain services.
- Business routing and data model logic are strictly separated.
- Socket.IO connection handlers manage auction room subscriptions (`auction:${auctionId}`) and user notification channels (`user:${userId}`).
- Middlewares enforce JWT verification, Role-Based Access Control (`BUYER`, `ARTIST`, `ORGANIZER`, `ADMIN`), and multipart/form-data upload handling.

### 2.2 Service Layer (`server/src/services/`)
- Encapsulates all domain business logic and transactional workflows.
- No direct database queries in controllers; all persistence is mediated through services.
- Executes financial and inventory operations within atomic database transactions.

### 2.3 Data Persistence Layer (`server/prisma/`, PostgreSQL)
- Relational data model managed via Prisma ORM.
- Enforces relational foreign keys, cascade rules, and indexes on commonly searched fields (e.g. `category`, `status`, `seller_id`, `artist_id`, `auction_id`).
- Implements strict ACID transactions for balance transfers and artwork inventory locks.

### 2.4 Asynchronous Worker Queue (`server/src/workers/`)
- Background queue handling CPU-bound visual similarity calculations.
- On artwork upload, artwork status is immediately saved as `PENDING`, returning HTTP 201 to the client without blocking.
- Worker calculates 64-bit dHash using `sharp` and checks Hamming distance against stored hashes.
- Artwork exceeding the similarity threshold (> 80%) is updated to `FLAGGED` and routed to the Admin Review Queue; otherwise marked `APPROVED`.

---

## 3. Real-Time Communication Architecture

- **Engine**: Socket.IO integrated with the Node.js HTTP server.
- **Rooms**:
  - `auction:${auctionId}`: Broadcasts `auction:new_bid`, countdown updates, and auction closure events.
  - `user:${userId}`: Private channel for individual notifications (e.g. `auction:outbid`, order confirmation).
- **Resilience**: State re-sync on client reconnect; server remains authoritative source of current highest bid, ending timestamp, and winner.

---

## 4. Key Design Patterns

1. **Transaction Script / Unit of Work**:
   - Used for internal credit deductions, purchases, and auction settlement.
   - Handled via `prisma.$transaction([ ... ])` to guarantee all-or-nothing execution.
2. **Producer-Consumer / Task Queue**:
   - Used for non-blocking image similarity processing via `sharp`.
3. **Observer / Pub-Sub**:
   - Room-based real-time event dissemination for auctions and outbid alerts.
4. **Policy / Strategy Pattern**:
   - Reusable RBAC middleware and dynamic similarity threshold evaluation.
5. **Factory Pattern**:
   - Unique exhibition access token generator (e.g., `NK-EXH-2026-X9B2`).

---

## 5. Testing & Verification Architecture

Testing is structured into two complementary layers:
- **Playwright E2E & Browser Integration (`e2e/`)**:
  - 1:1 mapped to Acceptance Criteria in `requirements.md` (Sections 3.2–3.11).
  - Multi-context testing (simulating concurrent bidding between multiple buyers).
  - Responsive verification asserting layout usability at `360px`, `768px`, and `1280px` viewports.
- **Vitest Unit Testing (`server/tests/unit/`)**:
  - Rapid unit tests for bitwise Hamming distance math, perceptual hash generation, and token formatting.

---

## 6. Free-Tier Deployment Blueprint

| Service | Hosting Provider | Configuration |
| :--- | :--- | :--- |
| **Frontend SPA** | **Vercel** | React + Vite + Tailwind CDN deployment |
| **Backend API & WebSockets** | **Render** | Node.js web service running Express + Socket.IO + Sharp |
| **Relational Database** | **Supabase** | Free PostgreSQL tier connected via Prisma connection pooler |
| **Asset Storage** | **Supabase Storage** / Local Disk | Free object storage for artwork media |
