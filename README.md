# Nakshi — Art & Crafts Marketplace, Live Auctions & Virtual Exhibitions

A full-stack digital gallery and marketplace celebrating Bangladeshi arts, textiles, and craft heritage (Jamdani, Nakshi Kantha, terracotta pottery, brass, and traditional crafts).

---

## Features

- **Multi-Vendor Marketplace**: Artist storefronts, artwork listings, categorization, search & filtering.
- **Internal Credit-Based Transactions**: Secure fictional credits with atomic ledger transactions, race-condition protection, and simulated dummy top-ups (zero external payment gateway costs).
- **Admin-Managed Live Auctions**: Real-time bidding via WebSockets (Socket.IO), countdown synchronization, outbid alerts, and automated winner settlement.
- **Virtual Exhibitions**: Digital gallery walls, floor layout customization, VIP viewing windows, and unique access ticket tokens (`NK-EXH-2026-X9B2`).
- **Duplicate Artwork Protection**: Background visual similarity detection using `sharp` (64-bit dHash). Artwork exceeding the **80% similarity threshold** is automatically routed to an Admin Review Queue featuring side-by-side comparative moderation.
- **Responsive Gallery UI**: Crafted to match [DESIGN.md](.context/DESIGN.md) and [DESIGN_DIRECTION.md](.context/DESIGN_DIRECTION.md) down to **360px screen width**.

---

## Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, TanStack Query, Zustand.
- **Backend**: Node.js, Express.js, TypeScript, Socket.IO, Prisma ORM, Sharp.
- **Database**: PostgreSQL (compatible with Supabase free tier).
- **Testing**: Playwright (E2E & 360px responsive testing), Vitest (unit tests).
- **Deployment Target (100% Free Tier)**:
  - Frontend: Vercel
  - Backend & WebSockets: Render
  - Database: Supabase

---

## Project Structure

```
Nakshi/
├── .context/               # Requirements, Architecture, Design, & Decisions
│   ├── requirements.md
│   ├── architecture.md
│   ├── decisions.md
│   ├── progress.md
│   ├── DESIGN.md
│   └── DESIGN_DIRECTION.md
├── AGENTS.md               # Agent execution rules & workflows
├── client/                 # React + Vite + Tailwind Frontend
│   ├── src/
│   │   ├── components/     # UI primitives & domain modules (marketplace, auction, etc.)
│   │   ├── context/        # Auth and Socket contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Views
│   │   ├── services/       # API integration
│   │   └── styles/         # Tailwind directives & typography
│   ├── tailwind.config.ts  # Design tokens from DESIGN.md
│   └── vite.config.ts
├── server/                 # Express + Socket.IO + Prisma Backend
│   ├── prisma/
│   │   └── schema.prisma   # Relational models and indexes
│   ├── src/
│   │   ├── controllers/    # Thin HTTP route handlers
│   │   ├── middleware/     # Auth, RBAC, Multer, Error handlers
│   │   ├── routes/         # API routing
│   │   ├── services/       # Domain business logic & transactions
│   │   ├── sockets/        # Real-time WebSocket handlers
│   │   ├── workers/        # Async queue for Sharp image hashing
│   │   └── server.ts       # Server entry point
│   └── tests/              # Acceptance & unit tests
├── e2e/                    # Playwright E2E & 360px responsive test specs
├── playwright.config.ts    # Cross-browser & viewport test settings
└── package.json            # Root workspace orchestrator
```

---

## Prerequisites

- **Node.js**: v20.x or higher
- **npm** or **pnpm**
- **PostgreSQL** instance (local or hosted on Supabase)

---

## Environment Variables

### Server (`server/.env`)
Copy `server/.env.example` to `server/.env`:

```bash
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://user:password@localhost:5432/nakshi?schema=public"
JWT_SECRET=your_jwt_secret_key
SIMILARITY_THRESHOLD=80
UPLOAD_DIR=./uploads
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SUPABASE_S3_ENDPOINT=https://<project-ref>.storage.supabase.co/storage/v1/s3
SUPABASE_S3_ACCESS_KEY_ID=your_supabase_s3_access_key_id
SUPABASE_S3_SECRET_ACCESS_KEY=your_supabase_s3_secret_access_key
SUPABASE_S3_BUCKET=nakshi-artworks
SUPABASE_S3_REGION=ap-south-1
```

### Client (`client/.env`)
Copy `client/.env.example` to `client/.env`:

```bash
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_API_BASE_URL=http://localhost:5000
```


---

## Installation & Running

```bash
# 1. Install dependencies
npm install

# 2. Setup Prisma Database Schema
npm --prefix server run prisma:migrate

# 3. Start development servers concurrently
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

---

## API Endpoints
- **Authentication & RBAC (`/api/auth`)**:
  - `POST /api/auth/register` — Role-based user registration (`BUYER`, `ARTIST`, `ORGANIZER`).
  - `POST /api/auth/login` — Email & password login.
  - `POST /api/auth/google` — Google OAuth 2.0 verification and role-aware onboarding.
  - `POST /api/auth/forgot-password` — Request secure password reset token.
  - `POST /api/auth/verify-reset-token` — Validate reset token before setting new credentials.
  - `POST /api/auth/reset-password` — Reset account password with token.
- **Artwork & Storefront (`/api/artworks`)**:
  - `POST /api/artworks/upload` — Direct multipart image upload to Supabase Storage via S3 (`ARTIST` role).
  - `POST /api/artworks` — Publish new artwork listing with craft mediums, dimensions, and weight (`ARTIST` role).
  - `GET /api/artworks/my-artworks` — Retrieve all artworks published by the authenticated artist.
  - `GET /api/artworks/:id` — Get single artwork details and metadata.
  - `GET /api/artworks/storefront/:artistId` — Public storefront profile and published inventory.
- **Seller Analytics (`/api/seller`)**:
  - `GET /api/seller/metrics` — Aggregate sales volume, gross revenue, AOV, and recent customer orders (`ARTIST` / `ADMIN` role).
- **Live Auctions & Bidding (`/api/auctions`)**:
  - `POST /api/auctions/:id/bid` — Submit bid with step increment validation & wallet balance check (`BUYER` role).
  - `GET /api/auctions/:id` — Get auction details, bid history, and next required minimum bid.
  - `POST /api/auctions` — Schedule and configure live auction (`ADMIN` role).

---

## Testing

```bash
# Run all tests
npm test

# Run backend unit & acceptance tests
npm run test:server

# Run Playwright E2E and responsive checks
npm run test:e2e
```

