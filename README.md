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

Copy `server/.env.example` to `server/.env`:

```bash
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://user:password@localhost:5432/nakshi?schema=public"
JWT_SECRET=your_jwt_secret_key
SIMILARITY_THRESHOLD=80
UPLOAD_DIR=./uploads
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

## Testing

```bash
# Run all tests
npm test

# Run backend unit & acceptance tests
npm run test:server

# Run Playwright E2E and responsive checks
npm run test:e2e
```
