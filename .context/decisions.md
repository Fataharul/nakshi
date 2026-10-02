# Decisions Log

## 1. Full-Stack Decoupled Architecture (Node.js/Express + React/Vite)
- **Timestamp**: 2026-09-23 02:00:00 +06:00
- **Context**: Need a responsive, robust web platform supporting complex real-time WebSocket auctions, transactional credit ledger operations, non-blocking image processing, and a gallery-style UI.
- **Decision**: Decouple the frontend (`client/` with React, Vite, Tailwind CSS) and backend (`server/` with Node.js, Express, TypeScript, Socket.IO, Prisma).
- **Rationale**:
  - Eliminates serverless WebSocket lifecycle hurdles common in Next.js.
  - Allows the React SPA to maintain persistent WebSocket audio/visual connections across page navigation.
  - Enables clean separation of concerns and independent free-tier deployment (Frontend on Vercel, Backend on Render).

## 2. PostgreSQL + Prisma ORM for Data & Financial Transactions
- **Timestamp**: 2026-09-23 02:00:00 +06:00
- **Context**: Requirement 2.1 mandates a relational database (PostgreSQL), and Requirement 2.3 mandates atomic credit operations that prevent negative balances, duplicate charges, and inconsistent ledgers.
- **Decision**: Use PostgreSQL managed via Prisma ORM.
- **Rationale**:
  - Prisma provides type-safe query generation and intuitive interactive transactions (`prisma.$transaction`) to safely handle atomic balance deductions, seller payouts, order creation, and artwork status updates.
  - Schema migrations, relations, and indexes on search/foreign keys are maintained declaratively.

## 3. Sharp + 64-bit dHash for Duplicate Artwork Detection (Zero External Cost)
- **Timestamp**: 2026-09-23 02:00:00 +06:00
- **Context**: Need to detect visual similarity exceeding 80% without expensive external vector databases or paid AI vision APIs. Must run asynchronously without blocking the server.
- **Decision**: Implement perceptual hashing (dHash) using `sharp` to extract 64-bit hashes, compare via Hamming distance (bitwise XOR), and run inside an in-process background worker queue.
- **Rationale**:
  - `sharp` executes in milliseconds using native libvips.
  - Bitwise Hamming distance computation takes less than 2ms for thousands of images and requires zero external cloud API costs.
  - The similarity threshold is exposed as a configurable environment variable (`SIMILARITY_THRESHOLD=80`).

## 4. Playwright as Primary Acceptance & Responsive Testing Framework
- **Timestamp**: 2026-09-23 02:00:00 +06:00
- **Context**: The project has strict multi-role workflows, real-time WebSocket outbid events, admin side-by-side comparison moderation, and a mandatory 360px mobile usability requirement.
- **Decision**: Adopt Playwright for end-to-end and responsive acceptance testing, mapping test specs 1:1 to the acceptance criteria in `requirements.md` (Sections 3.2–3.11).
- **Rationale**:
  - Playwright's multi-context isolation allows authentic testing of real-time concurrent bidding (e.g. Buyer 1 bids in one context while Buyer 2 receives the outbid event in another context).
  - Built-in viewport emulation directly verifies the 360px minimum width requirement.
  - Supports direct REST API requests via Playwright's `request` fixture.

## 5. Strict Design System Mapping from DESIGN.md
- **Timestamp**: 2026-09-23 02:00:00 +06:00
- **Context**: UI must follow the cultural heritage palette and digital gallery aesthetic documented in `DESIGN.md` and `DESIGN_DIRECTION.md`.
- **Decision**: Map all design tokens into `client/tailwind.config.ts`:
  - Canvas & Surfaces: Muslin `#FBF9F4`, `#F5F2EB`, `#DBD7CD`.
  - Terracotta Primary: `#86452a` / `#A45C40`.
  - Typography: Charcoal `#1A1918` with Playfair Display (headings) and Inter (body/labels).
  - Radii: Crisp 4px (`rounded-DEFAULT`) for buttons/inputs, 8px (`rounded-lg`) for artwork cards, pill for status badges.

## 6. Supabase PostgreSQL via Session Pooler (Port 5432)
- **Timestamp**: 2026-09-23 02:25:00 +06:00
- **Context**: Need a free hosted PostgreSQL database compatible with Prisma interactive transactions (`$transaction`) and database migrations (`prisma migrate`), as well as IPv4 network access.
- **Decision**: Connect to Supabase using the Session Pooler endpoint on port 5432 (`aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require`).
- **Rationale**:
  - Unlike transaction pooler mode (port 6543) which disables session-level locks and breaks Prisma migrations, session mode fully supports both DDL schema migrations and DML interactive transactions.
  - Guarantees IPv4 network routing for local development and Render deployment without requiring paid IPv6 add-ons.

## 7. Role-Based Self-Registration Restriction & Cryptographic Password Reset
- **Timestamp**: 2026-09-23 03:08:00 +06:00
- **Context**: Public self-registration must prevent privilege escalation to administrative roles, and password reset must be cryptographically secure without relying on third-party paid mail APIs.
- **Decision**: Restrict public registration strictly to `BUYER`, `ARTIST`, and `ORGANIZER` roles in `registerSchema`. Admin accounts are created solely via seeding or internal promotion. Password reset utilizes a timed, 32-byte cryptographic hex token (`crypto.randomBytes(32)`) with 1-hour expiration and bcrypt re-hashing.
- **Rationale**:
  - Eliminates unauthorized elevation of privilege via direct API manipulation.
  - Satisfies Requirements 2.2 and 3.2 without third-party email service expenses.

## 8. Google OAuth 2.0 Integration & Account Harmonization
- **Timestamp**: 2026-09-29 09:53:00 +06:00
- **Context**: Users require frictionless authentication while adhering to role-based access control and security guidelines.
- **Decision**:
  - Implement frontend authentication using `@react-oauth/google` with `GoogleLogin` component wrapped in `GoogleOAuthProvider`.
  - Verify tokens on the backend using `google-auth-library` (`OAuth2Client.verifyIdToken`) against `GOOGLE_CLIENT_ID`.
  - Schema extension: Make `User.passwordHash` optional (`String?`), add unique `googleId` (`String? @unique`), and `isVerified` (`Boolean @default(false)`).
  - Support role-aware Google registration: When signing up from `RegisterPage`, validate chosen role (`BUYER`, `ARTIST`, `ORGANIZER`) preventing privilege escalation, and atomically initialize the user record and 0.00 credit wallet in `prisma.$transaction`.
  - On Google sign-in (or when no role is specified), default new user provisioning to `BUYER`, while preserving existing user accounts and roles.
  - Prevent password logins or password changes on accounts created purely via Google OAuth, responding with specific actionable guidance.
- **Consequences**:
  - Simplifies user onboarding without compromising wallet integrity or security.
  - Preserves RBAC and JWT token format uniformity across local and OAuth users.

## 9. Harmonized Artist Dashboard with Dual Metrics and Storefront Management
- **Timestamp**: 2026-09-29 19:53:00 +06:00
- **Context**: Merging concurrent artist feature branches (`T-026`/`T-030` for artwork publishing and storefront inventory, and `T-034` for sales performance metrics) required a unified dashboard layout adhering to `DESIGN.md`.
- **Decision**:
  - Place `SellerMetricsView` at the top of the artist dashboard view directly below the identity and credit wallet banner to give artists immediate visibility into total revenue, order count, and AOV.
  - Embed the Storefront Management section (`Published Artworks`, `+ Add New Artwork` modal trigger, and dynamic grid) in the primary 2-column layout alongside user settings and session information.
  - Ensure all artwork card displays feature both craft medium classification and physical dimensions/weight indicators.
- **Rationale**:
  - Aligns with the "Digital Gallery" aesthetic in `DESIGN.md` without fragmenting the artist experience into disparate pages.
  - Preserves a high-contrast hierarchy (metrics overview first, inventory management second).

## 10. Direct Artwork Image Upload via Supabase S3-Compatible Storage
- **Timestamp**: 2026-09-29 21:30:00 +06:00
- **Context**: Artists previously had to host images externally and paste URL links when publishing handcrafted artworks. Direct image upload was requested using Supabase Storage S3-compatible credentials.
- **Decision**:
  - Use AWS SDK for JavaScript v3 (`@aws-sdk/client-s3`) on the backend to interact directly with Supabase Storage via its S3 API endpoint (`https://<project-ref>.storage.supabase.co/storage/v1/s3`) with credentials configured via environment variables (`SUPABASE_S3_ACCESS_KEY_ID`, `SUPABASE_S3_SECRET_ACCESS_KEY`, `SUPABASE_S3_BUCKET`, `SUPABASE_S3_REGION`, `SUPABASE_S3_ENDPOINT`).
  - Implement `StorageService` with strict validation: whitelist image MIME types (`image/jpeg`, `image/png`, `image/webp`) and maximum file size of 5MB.
  - Provide an automated test environment fallback (saving to local `./uploads/artworks` when `process.env.NODE_ENV === 'test'`) so CI and offline Vitest suites execute deterministically without cloud S3 dependencies.
  - Implement file upload middleware using `multer` with memory storage to stream directly to S3.
  - Secure upload endpoint (`POST /api/artworks/upload`) with `authenticateJWT` and `requireRoles(Role.ARTIST)`.
  - Update `CreateArtworkModal.tsx` on the frontend with drag-and-drop file picker, live thumbnail preview, file replacement/removal triggers, upload progress spinner, and optional manual URL input toggle.
- **Rationale**:
  - S3-compatible protocol avoids bundling vendor-specific SDKs while remaining 100% interoperable with Supabase Storage buckets.
  - Client-side direct file picker dramatically improves the artisan UX while server-side upload routing enforces authentication, RBAC, and payload validation.

## 11. Unified Seller Dashboard Layout Architecture
- **Timestamp**: 2026-09-29 22:25:00 +06:00
- **Context**: The seller/artist dashboard previously fragmented artist identity, metrics, and storefront inventory into generic user cards mixed with consumer session information. A unified, dedicated seller studio layout was required while deferring complex dynamic metrics logic to later phases.
- **Decision**:
  - Implement a dedicated `SellerDashboardLayout` component in `client/src/components/dashboard/SellerDashboardLayout.tsx` and route artist role views cleanly from `DashboardPage.tsx`.
  - Structure the layout into clear, cohesive architectural sections:
    1. **Artist Studio Header & Identity Bar**: Displays artist avatar/initials, name (`#dashboard-user-name`), role badge (`#dashboard-role-badge`), verified artisan mark, biography summary, credit wallet card (`#dashboard-wallet-balance`), and primary action "+ Add New Artwork" (`#add-artwork-btn`).
    2. **Sales & Performance Metrics Section**: Clean 4-card editorial KPI layout (Total Revenue, Total Orders, Average Order Value, Active Inventory) adhering to `DESIGN.md` Muslin card design with 1px borders and Playfair Display figures, structured for later data population.
    3. **Storefront & Inventory Management Section**: Displays published artworks grid (`#artworks-grid`) with craft medium tags, dimension/weight metadata, credit prices, availability badges, and interactive availability filters (`ALL`, `AVAILABLE`, `SOLD`), with an empty state CTA when no artworks are published.
    4. **Studio Profile & Guidelines Sidebar**: Summarizes studio profile attributes, craft specialty, verification status, and storefront guidelines.
  - Preserve all existing DOM selectors (`#dashboard-user-name`, `#dashboard-role-badge`, `#dashboard-wallet-balance`, `#add-artwork-btn`, `#artworks-grid`, `#no-artworks-banner`) to ensure 100% backward compatibility with Playwright E2E and component test suites.
## 12. Artwork Search & Marketplace Discovery Interface Architecture
- **Timestamp**: 2026-09-29 22:36:00 +06:00
- **Context**: Requirement 1.1 mandates allowing buyers to discover, search, and filter available artworks across Bangladeshi heritage craft categories. A dedicated, responsive discovery interface was required adhering to `DESIGN.md` and `DESIGN_DIRECTION.md`.
- **Decision**:
  - Implement a dedicated `ArtworkSearchInterface` component in `client/src/components/marketplace/ArtworkSearchInterface.tsx` and host it within `client/src/pages/MarketplacePage.tsx` mounted at `/marketplace` and `/search`.
  - Provide instant client-side interactive search & filtering across:
    1. Search keywords matching title, artisan name, craft medium, geographic region, description, and motifs (`#artwork-search-input`).
    2. Horizontally scrollable craft medium pill filters (`#medium-filter-all`, `#medium-filter-nakshi-kantha`, `#medium-filter-handloom-jamdani`, etc.) derived from standard `CRAFT_MEDIUMS`.
    3. Refinement controls for price boundaries (`Under 500`, `500 - 1000`, `Above 1000 Credits`), availability toggle, and multiple sort orders (`Latest Additions`, `Price: Low to High`, `Price: High to Low`, `Artwork Name: A to Z`).
    4. Matted 3-column editorial gallery grid (`#search-artworks-grid`) conforming to `DESIGN_DIRECTION.md` with subtle scale hover transitions, image containers, craft medium tags, Playfair Display titles, dimensions/weight metadata, and valuation in credits.
    5. Clean empty state with query feedback and one-click filter reset (`#no-search-results-banner`).
  - Wire up global navigation in `Navbar.tsx` (`Marketplace` link) and `HomePage.tsx` ("Explore Marketplace" button).
- **Rationale**:
  - Delivers an art-first minimalist gallery experience putting handcrafted heritage textiles and ceramics at the visual center.
  - Ensures seamless usability across desktop, tablet, and mobile 360px viewports.







## 13. Authenticated Google Account Linking
- **Timestamp**: 2026-09-30 21:35:00 +06:00
- **Context**: Users originally logging in with an email/password needed the ability to manually link a Google account for subsequent seamless logins, without creating parallel duplicate accounts.
- **Decision**: 
  - Expose a specialized `POST /api/auth/link-google` endpoint requiring active JWT (`authenticateJWT`).
  - Introduce a UI component in `AccountSetupPage.tsx` that leverages `@react-oauth/google` merely to produce an `idToken`, avoiding the standard sign-in flow.
  - Explicitly fail the link operation (HTTP 409 Conflict) if the provided Google ID is already tied to a distinct user record.
- **Rationale**: 
  - Prevents credential hopping between accounts while granting users the flexibility to transition to single-sign-on (SSO) securely.

## 14. Auction Creation & Management for Verified Artists
- **Timestamp**: 2026-10-02 14:45:00 +06:00
- **Context**: Allowing verified artisans to list exclusive live bidding events for eligible artworks, avoiding complex frontend polling by strictly enforcing auction integrity through backend Prisma validations.
- **Decision**:
  - Introduce an `Auction` Prisma model tracking status (`UPCOMING`, `ACTIVE`, `ENDED`, `CANCELLED`), starting/highest bids, and time constraints.
  - Enforce atomic transaction safety in the backend: Creating an auction reserves the artwork (`availability = RESERVED`) mitigating race conditions around concurrent sales.
  - UI logic explicitly evaluates `isVerified` from the backend to ensure RBAC is strictly applied.
  - Centralize logic in `AuctionService` and integrate directly into the `SellerDashboardLayout` alongside static artworks for a consolidated inventory view.
- **Rationale**:
  - Satisfies verified-only creation business rules cleanly using RBAC.
  - Database acts as the single source of truth for auction timelines and eligibility constraints, preventing timezone or clock manipulation exploits.
