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

## 15. Transactional Auction Bid Submission & Wallet Logic
- **Timestamp**: 2026-10-07 17:00:00 +06:00
- **Context**: Need a robust backend system to securely process live auction bids, deduct credits from the current bidder, and accurately refund the previous highest bidder, all while ensuring no race conditions affect credit ledgers.
- **Decision**:
  - Implemented `placeBid` in `AuctionService` executing entirely within a `prisma.$transaction`.
  - Atomically verifies bidder wallet balance, deducts the bid as an `AUCTION_BID_HOLD`, creates the new `AuctionBid`, and updates `currentHighestBid` on the `Auction`.
  - Automatically identifies the previous highest bidder (if any) and increments their wallet balance back by the previous bid amount, logging an `AUCTION_BID_REFUND`.
  - Uses `Socket.IO` instance to immediately broadcast `auction:new_bid` to the room and a private `user:outbid` message to the displaced highest bidder.
- **Rationale**:
  - Strongly protects financial constraints defined in requirements.md (no negative balances, atomic operations).
  - Guarantees immediate real-time updates for connected participants.

## 16. Modular Artwork Card Component & RESTful Artwork Like Action
- **Timestamp**: 2026-10-15 07:50:00 +06:00
- **Context**: Need a consistent, reusable card presentation across marketplace search and dashboards with interactive actions (such as likes) without cluttering monolithic search views.
- **Decision**:
  - Extracted `<ArtworkCard />` component into `client/src/components/marketplace/ArtworkCard.tsx` isolating image presentation, status badges, typography, and interactive buttons.
  - Implemented optimistic UI updates for the Like button with automatic state reversion on network errors.
  - Established standard REST action endpoint `POST /api/artworks/:id/like` updating database `like` counter with atomic increment.
  - Created `.context/guidelines.md` as the unified full-stack developer guide for feature additions and Playwright E2E workflows.
- **Rationale**:
  - Eliminates 100+ lines of duplicate card markup from `ArtworkSearchInterface.tsx`.
  - Ensures clean separation of concerns and reliable, isolated Playwright E2E testability.

## 17. Gallery Discovery Hub Consolidation & Community Interaction (Phase 1)
- **Timestamp**: 2026-10-21 22:00:00 +06:00
- **Context**: The navbar previously featured a disjointed "Marketplace" link with mock data, while "Gallery" navigated back to the landing page. Buyers had no way to view artwork details, purchase pieces, or engage (like, comment) on artworks posted by artisans.
- **Decision**:
  - Deprecate and remove "Marketplace" from the primary navbar in `Navbar.tsx`; designate **Gallery** (`/gallery`) as the canonical discovery hub for curated heritage artworks.
  - Create `ArtworkDetailPage.tsx` (`/artworks/:id`) presenting high-resolution matted frames, provenance metadata (medium, style, dimensions, weight), artisan biography card, purchase action CTA, and interactive like & comment feeds.
  - Wire all "Details" action buttons and card title links to navigate directly to `/artworks/:id`.
  - Introduce `ArtworkComment` Prisma model (`content`, `userId`, `artworkId`, `createdAt`) with cascading artwork deletion and relationships to `User` and `Artwork`.
  - Provide authenticated REST endpoints `GET /api/artworks/:id/comments` and `POST /api/artworks/:id/comments`.
- **Rationale**:
  - Aligns customer journey with `.context/DESIGN_DIRECTION.md` and `.context/DESIGN.md`, reinforcing an exhibition and heritage gallery experience instead of a sterile retail storefront.
  - Enforces database-backed interaction integrity with role-based checks and automatic cleanup on artwork deletion.

## 18. Simulated Credit Top-Up & Transaction Ledger (Phase 2)
- **Timestamp**: 2026-10-22 18:00:00 +06:00
- **Context**: To fulfill Requirement 2.3 ("Platform operates strictly using simulated internal credits; zero external payment gateways") and unblock fixed-price marketplace purchasing and auction escrow, users need a transparent mechanism to acquire internal credits and review their historical financial transactions without mock data.
- **Decision**:
  - Build backend wallet services and endpoints (`POST /api/wallet/top-up`, `GET /api/wallet/balance`, `GET /api/wallet/transactions`) guarded by `authenticateJWT`.
  - Execute balance additions inside a single interactive Prisma transaction (`prisma.$transaction`) using high-precision Decimal math, updating `wallet.balance` and recording an audit trail in `CreditTransaction` with type `TOP_UP`.
  - Provide frontend `TopUpCreditsModal.tsx` offering standard preset denominations (250, 500, 1000, 2500 credits) and custom numerical input with live validation, adhering to `DESIGN.md` (Muslin `#FBF9F4` canvas, Terracotta `#86452a` action buttons, and clear educational simulation disclosures).
  - Provide frontend `TransactionLedgerView.tsx` with paginated credit audit records, transaction type badges (`TOP_UP`, `PURCHASE_DEBIT`, `SALE_CREDIT`, `AUCTION_BID_HOLD`, etc.), dates, and balance summary.
  - Wire quick top-up triggers directly into the global `Navbar` balance badges (`#navbar-wallet-balance`, `#mobile-wallet-balance`), `AccountSetupPage`, and `DashboardPage` so users can instantly top up from anywhere in the application.
- **Rationale**:
  - Strictly fulfills the zero-external-gateway specification while giving buyers and collectors full freedom to simulate platform transactions.
  - Atomic database transactions ensure balance consistency and prevent financial drift across concurrent operations.

## 19. Atomic Order Checkout Engine & Concurrency Locking (Phase 3)
- **Timestamp**: 2026-10-22 18:35:00 +06:00
- **Context**: To fulfill Requirement 2.4 ("Single-edition fixed-price marketplace purchase using internal credits with race-condition double-purchase prevention"), buyers must be able to acquire artworks atomically, deduct credits, credit artisans, and generate official order records without double-purchasing.
- **Decision**:
  - Create `OrderService` and `OrderController` exposed via `POST /api/orders/checkout`, `GET /api/orders/my-orders`, and `GET /api/orders/:id` protected by `authenticateJWT` and `requireRoles(Role.BUYER, Role.ADMIN)`.
  - Perform checkout in an interactive `prisma.$transaction`:
    - Validates that the artwork is `AVAILABLE` and `APPROVED`.
    - Prohibits self-purchase if `buyerId === artwork.artistId`.
    - Enforces optimistic concurrency locking via `tx.artwork.updateMany({ where: { id: artworkId, availability: 'AVAILABLE' }, data: { availability: 'SOLD' } })`. If another concurrent checkout already acquired the piece, `updateMany.count === 0`, causing an immediate transaction rollback with a clean `409 Conflict`.
    - Atomically debits buyer wallet (`PURCHASE_DEBIT`), credits seller wallet (`SALE_CREDIT`), and creates an immutable `Order` record linking buyer, seller, artwork, and amount paid.
  - Provide frontend `PurchaseConfirmationModal.tsx` portalled to `document.body` with `z-[9999]`:
    - Shows artwork provenance, valuation, available credits, and remaining balance.
    - Displays an insufficient balance alert with a direct trigger to open `TopUpCreditsModal` if balance is lower than artwork price.
    - Shows celebration banner upon successful purchase and triggers automatic refresh of `AuthContext.user.walletBalance` and `artwork.availability`.
- **Rationale**:
  - Enforces database-level consistency guarantees, ensuring zero double-purchasing or phantom credit deductions during high-concurrency race conditions.
  - Seamlessly links internal credit top-up to fixed-price checkout without breaking user momentum.

## 20. Infinite Scroll Gallery Architecture & Dynamic Chunk Streaming
- **Timestamp**: 2026-10-22 19:33:00 +06:00
- **Context**: The gallery previously loaded a fixed top-50 artwork snapshot. As catalog size grows (400+ artworks), users requested a continuous discovery experience similar to Instagram and Facebook feeds without missing older listings.
- **Decision**:
  - Replace static single-batch loading with dynamic batched pagination (`ITEMS_PER_PAGE = 48`, optimized for 1, 2, 3, and 4-column responsive grid layouts).
  - Use modern browser `IntersectionObserver` on an invisible sentinel element (`#gallery-infinite-scroll-sentinel`) with `rootMargin: '250px'` to preemptively stream and append the next page chunk before reaching the page bottom.
  - Implement request ID generation (`activeRequestIdRef`) to prevent asynchronous race conditions and ensure that out-of-order network responses during rapid keystroke searches do not overwrite active feeds.
  - Support global backend ordering via `sortBy` parameter (`LATEST`, `PRICE_ASC`, `PRICE_DESC`, `TITLE_ASC`) in `server/src/utils/artwork.validation.ts` and `ArtworkService.getArtworks` to ensure continuous pagination accurately reflects user sorting criteria across all pages.
  - Display heritage aesthetic loading spinner (`#gallery-loading-more-spinner`), an accessible fallback trigger (`#gallery-load-more-btn`), and an end-of-catalog indicator (`#gallery-end-of-collection`).
- **Rationale**:
  - Provides a frictionless discovery UX while preventing client DOM bloat and minimizing initial page load payload.
  - Discarding stale out-of-order responses eliminates ghost listings during rapid query updates.

## 21. Flagged Listing Routing & Update Verification Engine
- **Timestamp**: 2026-11-02 20:06:00 +06:00
- **Context**: To strictly fulfill Requirement 2.7 & 3.7 ("Route artwork exceeding duplicate threshold to administrator review; hidden from marketplace; similarity failures do not silently bypass duplicate protection"), listings must be consistently routed to the administrator review queue across both creation and update lifecycles, and administrators must be able to flag listings directly from the user interface.
- **Decision**:
  - **Listing Update Re-evaluation**: Enhanced `ArtworkService.updateArtwork` to recompute perceptual dHash and evaluate Hamming distance similarity whenever `imageUrl` is modified. If similarity against existing pieces exceeds the 80% threshold (or if image similarity computation encounters an error), the listing's `moderationStatus` is shifted to `FLAGGED` and a `ModerationReview` record is created or updated, immediately hiding the listing from public marketplace search.
  - **Administrator Flagging Endpoint**: Added `POST /api/moderation/:id/flag` guarded by `authenticateJWT` and `requireRoles(Role.ADMIN)` in `ModerationController` and `ModerationService.flagListing`. This allows platform administrators to flag any suspicious listing, calculate any closest catalogue fingerprint matches, and route it directly to the review queue.
  - **Orphan Reconciliation in Review Queue**: Updated `ModerationService.getQueue` to detect any `FLAGGED` artwork lacking an active `ModerationReview` record and automatically create a review entry, ensuring 100% of flagged listings appear in the admin queue.
  - **Editorial Admin UI Controls**: Added an accessible Administrator Console panel in `ArtworkDetailPage.tsx` (`#admin-flag-listing-btn`) adhering to `DESIGN.md` (warm neutral background, high contrast, and terracotta/error action badges) enabling admins to route listings to the review queue directly from the artwork view.
  - **Queue Fallback Display**: Polished `AdminModerationQueue.tsx` to cleanly handle listings flagged manually or without a paired match ("Direct Review Routing", "Pending Administrative Review").
- **Rationale**:
  - Prevents circumvention of duplicate protection via post-creation listing edits.
  - Enforces Requirement 2.7 resilience constraint: failures during processing do not silently publish unverified listings as approved.





## 22. Exhibition Viewing Time Tracking & Real-Time Heartbeat Architecture
- **Timestamp**: 2026-11-02 20:15:00 +06:00
- **Context**: Ticket T-082 (BL-025) and T-083 require computing and displaying exhibition engagement metrics (average viewing time, visitor count, tickets sold, and ticket revenue) without inflated figures or floating-point financial drift.
- **Decision**:
  - Add `ExhibitionVisit` model tracking `enteredAt`, `lastSeenAt`, and cumulative `durationSeconds` indexed by `exhibitionId` and `userId`.
  - Cap idle heartbeat gaps at 90 seconds (`MAX_HEARTBEAT_GAP_SECONDS = 90`) in `ExhibitionAnalyticsService.heartbeat` so idle or backgrounded tabs do not artificially inflate viewing time.
  - Calculate ticket revenue directly from persisted `EXHIBITION_TICKET` credit transaction records, summing in integer cents before converting to credits to prevent IEEE-754 floating-point errors.
  - Enforce RBAC on both backend (`GET /api/exhibitions/:id/analytics`) and frontend route (`/dashboard/organizer/exhibitions/:id/analytics`), restricting access strictly to the exhibition's owning `ORGANIZER` or platform `ADMIN`.
- **Rationale**:
  - Ensures accurate, tamper-resistant virtual exhibition performance analytics for organizers.
  - Aligns with the platform's internal credit ledger consistency model.

## 23. Strict Artwork Purchase Guard & Automated Moderation Verification Suite
- **Timestamp**: 2026-11-02 20:35:00 +06:00
- **Context**: In addition to public search filtering, platform transactions (order checkout and auction creation) must strictly disallow listings in `FLAGGED` or `REJECTED` states. Verification tests must exercise the 80% similarity threshold boundary, dynamic thresholds, failure-safe fallback, multi-module listing visibility, and review queue lifecycles.
- **Decision**:
  - Update `OrderService.checkout` to reject any artwork where `moderationStatus !== 'APPROVED'` (blocking both `FLAGGED` and `REJECTED` artworks with 400 Bad Request).
  - Implement acceptance test suite `server/tests/acceptance/threshold_visibility_queue.test.ts` with 14 automated tests covering:
    - Exact 80% boundary math (<=80% similarity approved, >80% flagged).
    - Dynamic similarity threshold (`SIMILARITY_THRESHOLD`) override.
    - Failure-safe handling: corrupt or broken image uploads fail safely into `FLAGGED` status and review queue rather than silent approval.
    - Listing visibility across marketplace browse, full-text search, and craft medium filters.
    - Purchase checkout and auction creation blocking for flagged listings.
    - Full admin review lifecycle: approval restoring public browse & purchase eligibility, rejection permanently preventing purchase, and manual routing (`POST /api/moderation/:id/flag`).
- **Rationale**:
  - Guarantees complete end-to-end integrity between moderation status and transaction workflows.
  - Prevents race conditions or direct API calls from acquiring unmoderated or flagged listings.

## 24. Dedicated Administrator Review Interface & Moderation Console Architecture
- **Timestamp**: 2026-11-02 21:20:00 +06:00
- **Context**: To strictly satisfy Requirements 2.7 & 3.7 and the visual specifications in `DESIGN_DIRECTION.md` and `DESIGN.md`, platform administrators require a dedicated, full-featured review interface for comparative inspection of flagged duplicate artwork uploads with high-resolution inspection, decision reason presets, queue filtering, and audit history.
- **Decision**:
  - Implement dedicated review page `AdminModerationPage.tsx` at `/admin/moderation` guarded by `ProtectedRoute allowedRoles={['ADMIN']}`.
  - Wire direct access points via desktop & mobile `Navbar` ("Moderation") and Admin `DashboardPage` ("Moderation Console").
  - Elevate `AdminModerationQueue.tsx` with:
    - Side-by-side 50/50 split view with floating similarity badge pinned at center.
    - Deep-dive fullscreen inspection modal (`#comparison-inspection-modal`) with synchronized spec comparison table and high-res imagery.
    - Queue search and risk filtering chips (All, High Match >90%, Catalogue Duplicates, Admin Manual Flags).
    - Quick reason presets for approval and rejection notes.
    - Navigation tabs switching between Active Review Queue and Chronological Audit History (`#tab-audit-history`).
    - Live metrics overview (pending count, approved overrides, rejected duplicates, average match score).
  - Add backend endpoints `GET /api/moderation/history` and `GET /api/moderation/stats` protected by `authenticateJWT` and `requireRoles(Role.ADMIN)`.
- **Rationale**:
  - Provides administrators with deep provenance inspection to distinguish authentic folk variations from fraudulent duplicates.
  - Maintains a complete, verifiable audit trail of every moderation decision taken.
## 25. Exhibition Ticket Token Validation & Entry Gate Hardening Architecture
- **Timestamp**: 2026-11-02 22:15:00 +06:00
- **Context**: Virtual exhibitions require robust admission control preventing ticket forgery, token cross-reuse, unauthorized viewing prior to schedule opening, or VIP bypass during restricted collector previews (Requirements 2.6, 3.6).
- **Decision**:
  - Implement dedicated backend ticket validation endpoint `POST /api/exhibitions/:id/validate-ticket` accepting `{ ticketToken: string }`:
    - Strict exhibition hall matching (`ticket.exhibitionId === exhibitionId`), preventing tokens generated for Exhibition A from unlocking Exhibition B with 400 Bad Request.
    - Schedule opening check (`now < exhibition.startTime`), blocking visitor entry before the exhibition viewing period opens with 403 Forbidden (with curator bypass allowing organizers to inspect halls prior to opening).
    - Schedule conclusion check (`now > exhibition.endTime`), returning 400 Bad Request once viewing periods end.
    - VIP viewing window enforcement (`now >= vipStartTime && now <= vipEndTime`), requiring VIP tier tickets and rejecting general admission tickets with 403 Forbidden until the VIP preview concludes.
  - Harden `ExhibitionService.getRoom` against cross-exhibition token injection, replacing unconstrained token search with strict `findUnique` matching and schedule start validation.
  - Enhance `ExhibitionRoomPage.tsx` Foyer Reception with:
    - Dedicated ticket token verification section (`#enter-ticket-token-section`, `#ticket-token-input`, `#validate-ticket-token-btn`).
    - Inline error banner (`#ticket-validation-error`) and success banner (`#ticket-validation-success`).
    - Seamless auto-validation via URL query parameter `?token=...` allowing immediate hall unlock on direct invite links.
    - State synchronization between purchase modal and foyer pass resolver.
  - Add comprehensive test suites:
    - 9 backend acceptance tests in `server/tests/acceptance/exhibition_ticket_validation.test.ts`.
    - 6 responsive E2E tests in `e2e/05_exhibition_tickets.spec.ts` (Desktop Chrome, Tablet 768px, and Mobile 360px).
- **Rationale**:
  - Enforces mathematical security and access integrity for ticketed cultural exhibitions.
  - Guarantees seamless guest entry via token input or direct pass links without compromising VIP exclusivity or exhibition schedules.

## 26. Expired Exhibition & Ticket Access Blocking Architecture
- **Timestamp**: 2026-11-02 23:15:00 +06:00
- **Context**: Virtual exhibitions have defined calendar viewing periods (`startTime` to `endTime`). Once an exhibition period has concluded, regular visitors and ticket holders must be blocked from entering virtual gallery halls, purchasing tickets, or upgrading passes, while organizers and admins must retain archival room access for audit, provenance inspection, and curatorial review (Requirements 2.6, 3.6).
- **Decision**:
  - Backend Access Hardening:
    - In `ExhibitionService.purchaseTicket`: Check `now > new Date(exhibition.endTime)` before initiating wallet transactions, rejecting purchases or VIP upgrades on concluded exhibitions with 400 Bad Request (`"Cannot purchase or upgrade passes for an exhibition whose viewing schedule has concluded"`). Configure interactive transaction timeouts with `{ maxWait: 10000, timeout: 20000 }` to guard against latency.
    - In `ExhibitionService.getRoom`: Resolve organizer identity prior to schedule expiration verification; block general visitors and pass holders once `now > exhibition.endTime` with 400 Bad Request (`"This exhibition has concluded its viewing schedule"`), while granting organizers/admins archival room access with 200 OK and `accessPass: { ticketToken: 'CURATOR-ACCESS', isVip: true }`.
  - Frontend UI Synchronization:
    - In `ExhibitionRoomPage.tsx`: Compute `isConcluded = now > new Date(exhibition.endTime)` and `isExpired = isConcluded && !isOrganizer`.
    - Main Viewport: Render `#exhibition-concluded-view` when `isExpired` is true, displaying conclusion date, curator attribution, expired pass token (`#expired-ticket-token-pill`) if held, schedule timeframe, disabled pass button with `#exhibition-concluded-badge`, and `#return-to-catalog-btn` navigating back to `/exhibitions`. Virtual gallery wall tabs and exhibit frames are strictly blocked from rendering.
    - Header: Display `#expired-ticket-badge` with `"Viewing Closed"` when `isExpired` is true.
    - Foyer & Modal: In `#exhibition-foyer-view`, replace the active pass reservation button with `#exhibition-concluded-badge`. In `BuyTicketModal.tsx`, display `#modal-concluded-alert` and disable `#confirm-ticket-purchase-btn` when `isConcluded` is true.
  - Acceptance & E2E Verification:
    - 11 backend acceptance tests in `server/tests/acceptance/exhibition_ticket_validation.test.ts` verifying purchase blocking on closed exhibitions and curator archival entry.
    - 9 responsive E2E tests in `e2e/05_exhibition_tickets.spec.ts` verifying access blocking across Desktop Chrome, Tablet 768px, and Mobile 360px.
- **Rationale**:
  - Upholds exhibition schedule integrity and prevents financial deductions for concluded events.
  - Gives visitors clear, informative status explanations and recovery routes to the catalog while preserving essential curator auditing privileges.

## 27. VIP Access Window Temporal Lifecycle Verification & Asynchronous Filter Guard
- **Timestamp**: 2026-11-03 01:25:00 +06:00
- **Context**: Requirement 3.6 mandates: "VIP access is restricted to its configured time window" and edge case: "VIP access attempted outside the configured VIP window." Verification must validate all three temporal intervals (before, during, and after the VIP window) across backend REST APIs, frontend ticket reservation workflows, and responsive viewports, while eliminating asynchronous stale-filter race conditions.
- **Decision**:
  - Temporal Access Lifecycle Rules in `ExhibitionService.getRoom`:
    - **Pre-opening guard**: Visitors attempting entry before `startTime` are rejected with `403` ("This exhibition has not opened yet").
    - **Before the VIP window (`startTime <= now < vipStartTime`)**: Standard ticket holders and organizers have unrestricted access (200 OK); the hall is not prematurely locked with VIP restrictions.
    - **During the VIP window (`vipStartTime <= now <= vipEndTime`)**: Standard ticket holders are rejected with `403` ("The hall is currently reserved for VIP Collectors Pass holders. General admission opens following the VIP window."), while VIP pass holders and the exhibition organizer enter with `200 OK`. Upgrading a standard pass to a VIP pass immediately grants entry.
    - **After the VIP window (`vipEndTime < now < endTime`)**: VIP exclusivity expires automatically; standard ticket holders enter with `200 OK` without seeing the VIP restriction view.
  - Frontend Race Condition Guard in `ExhibitionsPage.tsx`:
    - Utilize `useRef<StatusFilter>(selectedFilter)` to ensure that concurrent or delayed async catalog responses from previous filter tabs do not overwrite the currently selected filter view with stale catalog items.
  - Modal State Reset in `BuyTicketModal.tsx`:
    - Clear `issuedTicket` and reset to VIP tier selection whenever the ticket modal is reopened from the `#vip-restriction-view` upgrade prompt.
- **Rationale**:
  - Provides mathematical and temporal certainty across the full lifecycle of exhibition scheduling.
  - Eliminates UI flicker and out-of-order response bugs during rapid catalog browsing.



## 28. Social Gallery Feed Homepage Architecture
- **Timestamp**: 2026-11-04 01:10:00 +06:00
- **Context**: The Nakshi homepage previously contained only a basic placeholder hero with static text and navigation buttons. The requirement was to evolve it into an engaging social feed inspired by Instagram and Facebook (stories tray, scrollable post stream, interactive likes, comments, and story modals), while maintaining strict visual consistency with the cultural heritage design tokens from `DESIGN.md` and `DESIGN_DIRECTION.md` without cluttering sidebars.
- **Decision**:
  - Implemented `HomePage.tsx` hosting a clean, focused, centered scrollable feed stream (`max-w-xl md:max-w-2xl mx-auto`):
    1. **Artisan Stories Tray (`ArtisanStoriesTray.tsx` & `StoryModal.tsx`)**: Horizontally scrollable circular story avatars with glowing terracotta/amber rings representing artisan studio processes and lore. Clicking an avatar opens an Instagram-style interactive story modal with auto-advancing progress timers, artisan quote, process imagery, and piece exploration CTA.
    2. **Category Filter Pills**: Horizontally scrollable craft medium chips ("All Crafts", "Handloom Jamdani", "Nakshi Kantha", "Terracotta Clay", "Brass & Bell Metal", etc.) providing instant client-side filtering.
    3. **Instagram/Facebook-Style Artwork Feed Cards (`FeedPostCard.tsx`)**: Featuring artisan header with verified mark and medium pill, high-resolution media with double-tap heart burst animation, valuation overlay, interactive Like button (with live counter and backend sync), expandable comment discussions with real-time patron commenting, share toast, bookmark toggle, and detailed inspection modal (`ArtworkDetailModal.tsx`).
    4. **Backward Compatibility**: Preserved all existing navigation DOM IDs (`#home-explore-marketplace-btn`, `#home-dashboard-btn`, `#home-explore-btn`, `#home-login-btn`) within an elegant welcome header banner.
- **Rationale**:
  - Dramatically improves user discovery and community engagement by transforming the homepage into a living, visual artisan exhibition.
  - Adheres strictly to `DESIGN.md` Muslin surfaces (`#FBF9F4`), Terracotta accents (`#86452A`), Playfair Display headings, Inter body typography, and ambient diffused shadows.
  - Guarantees seamless responsiveness down to 360px viewport width.

## 29. Production-Grade Authentic Heritage Seed & Real Data Harmonization
- **Timestamp**: 2026-11-04 02:30:00 +06:00
- **Context**: The platform previously accumulated 2,100+ automated test users and 600+ test artworks with broken image links (`example.com`, dead Unsplash query URLs), mock story bars, hardcoded feed arrays, and missing live auctions. The site needed to be presentation-ready with real multi-role personas, authentic Bengali craft imagery, genuine active auctions, and zero mock artifacts.
- **Decision**:
  - **Database Cleanup & Purge**: Implemented automated test fixture cleanup (`server/prisma/clean-test-data.ts`) to safely purge automated test artifacts (`%179%`, `%example.com%`, `%Playwright%`, etc.) while preserving schema foreign key integrity.
  - **Production-Grade Seeder (`server/prisma/seed.ts`)**:
    - Created multiple realistic users across all 4 roles: Artists (*Rokeya Begum*, *Alkas Mia*, *Gouranga Pal*, *Sukumar Banik*), Collectors (*Tanvir Ahmed*, *Sadia Rahman*, *Farhan Kabir*), Curators (*Naveed Chowdhury*, *Dr. Anisur Rahman*), and Platform Admin with authentic biographies, initial wallet balances, and verified artisan credentials.
    - Provisioned 24 authentic heritage artworks across Bangladeshi craft categories (Handloom Jamdani, Nakshi Kantha, Terracotta Clay, Brass & Bell Metal, Shital Pati, Jute Craft, Wood Carving, Patua Folk Painting) with realistic dimensions, weights, and credit valuations.
    - Used verified high-resolution, open-access public domain & Creative Commons images (all verified with HTTP 200 OK).
    - Established realistic Live & Upcoming Auctions with bidding histories so auction explorer and live auction rooms appear active and authentic.
    - Created rich virtual exhibitions with multi-hall layouts and valid scheduling windows.
  - **Frontend Real-Data Harmonization**:
    - Removed `CURATED_FEED_POSTS` and bound `HomePage.tsx` to live REST API dispatches from PostgreSQL.
    - Derived `ArtisanStoriesTray.tsx` dynamically from real database artists and their newly listed pieces, linking stories directly to `/artworks/:id`.
    - Removed `CURATED_HERITAGE_ARTWORKS` from `ArtworkSearchInterface.tsx` and computed craft medium filter counts dynamically from loaded database records.
    - Enhanced `ArtworkCard.tsx` and `FeedPostCard.tsx` with `getArtworkImageUrl` and `onError` image fallback guards to guarantee zero broken image frames in the client.
    - Updated `LoginPage.tsx` quick role switcher to present authentic personas (*Tanvir Ahmed*, *Rokeya Begum*, *Naveed Chowdhury*, *Admin*).
- **Rationale**:
  - Delivers an authentic, presentation-ready digital gallery showcasing Bengali craft heritage without mock data or broken URLs.
  - Maintains 100% backward compatibility with automated test suites and existing test selectors.

## 30. Bundled High-Resolution Cultural Heritage Assets & Admin Moderation Isolation
- **Timestamp**: 2026-11-04 07:30:00 +06:00
- **Context**: Broken links (`/uploads/artworks/454d34a3...`) persisted from legacy test accounts in the Admin Moderation Queue, and previous keyword-matched stock photos included mismatched imagery (e.g. whiteboard presentations, red sneakers, office furniture). The Admin Moderation Console also suffered from duplicate comparison loops and lack of image fallback guards.
- **Decision**:
  - **Local Heritage Image Repository**: Curated and bundled 18 museum-grade, culturally verified high-resolution photographs directly in `client/public/images/heritage/` covering all 8 traditional Bengali craft disciplines (Dhakai Jamdani handloom, Nakshi Kantha folklore quilts, Kantajew temple terracotta relief plaques, Dhamrai lost-wax brass peacock deepams, Sylhet Shital Pati cane mats, golden jute tapestries, carved teakwood panels, and Dhaka rickshaw tinplate art).
  - **Eliminates External Network Dependency**: Images are bundled directly in the application repository, loading instantaneously with zero external network reliance, zero CDN 404 risk, and zero third-party blocking.
  - **Image Utility & Server Static Route**: Updated `image.util.ts` to treat local `/images/` paths as direct client-side static assets (not prepended with backend port 5000) and added an Express `/images` static fallback route in `server.ts`. Set `DEFAULT_ARTWORK_IMAGE` to authentic masterwork `/images/heritage/nakshi-kantha-quilt.jpg`.
  - **Admin Moderation Queue Hardening**: Wrapped all `<img>` elements in `AdminModerationQueue.tsx` with `getArtworkImageUrl` and `onError` fallback handlers so broken image icons never render.
  - **Realistic Duplicate Moderation Case**: Provisioned an authentic 88.4% perceptual similarity review in the Admin Moderation Queue comparing an heirloom Padma lotus kantha against a variant edition, plus realistic approved and rejected historical review records.
  - **Purged Legacy Uploads**: Enhanced `clean-test-data.ts` to purge broken `/uploads/` artifacts and legacy test accounts (`rokeya@gmail.com`, `sama@gmail.com`).
- **Rationale**:
  - Ensures 100% cultural accuracy, zero broken links, and a presentation-grade visual experience across all pages (Marketplace, Auctions, Admin Moderation, and Discovery Feed).

## 31. Perceptual dHash Duplicate Detection Pipeline & Multi-Case Moderation Queue Harmonization
- **Timestamp**: 2026-11-04 19:00:00 +06:00
- **Context**: The duplicate detection pipeline had an issue where duplicate artwork listings (such as Sukumar Banik's brass ritual plate pieces) were uploaded but did not appear in the Admin Moderation Queue. Additionally, the admin dashboard only contained a single flagged artwork listing, leaving the moderation queue underpopulated for presentations.
- **Root Cause**:
  1. `ArtworkService.resolveImageBuffer` only handled `http://`, `https://`, and `/uploads/` paths. It could not resolve local static heritage assets (`/images/heritage/...`) from the client public directory. When Sharp failed to locate the file, the service fell back to an MD5 hash of the URL string.
  2. Because the seed script inserted artworks directly via `prisma.artwork.create()` without computing hashes, seeded artworks had `imageHash: null` or mismatched MD5 fallbacks. Comparing a real 64-bit Sharp dHash against an MD5 fallback yielded a Hamming distance similarity of ~40%, failing the 80% duplicate detection threshold.
- **Decision**:
  - **Local Static Image Buffer Resolution**: Enhanced `ArtworkService.resolveImageBuffer` to look up `/images/` paths directly in `client/public/` so uploaded artworks referencing bundled heritage imagery are resolved and processed via Sharp native libvips.
  - **Authentic 64-bit Sharp dHashes for Dataset**: Generated real 64-bit Sharp dHashes for all 18 bundled heritage assets and mapped them via `HERITAGE_IMAGE_HASHES` in `server/prisma/seed.ts`. Every seeded artwork in PostgreSQL now possesses an authentic perceptual hash.
  - **Multi-Case Moderation Queue Experience**: Seeded 4 distinct PENDING moderation review cases for the admin presentation view:
    1. *Padma Phul Kantha Tapestry (Variant Edition)* vs *Padma Medallion Heirloom Kantha* (88.4% match)
    2. *Dhamrai Bell-Metal Temple Gong & Mallet* vs *Hand-Chiseled Kansa Bell-Metal Ritual Thali* by Sukumar Banik (100% match)
    3. *Old Dhaka Floral Rickshaw Hood Panel* vs *Vibrant Dhaka Rickshaw Tinplate Art* by Rokeya Begum (100% match)
    4. *Noakhali Golden Jute Braided Floor Rug* vs *Golden Fiber Braided Jute Wall Hanging* by Rokeya Begum (100% match)
  - **Preserved Historical Moderation Audit Logs**: Maintained 2 realistic resolved reviews (1 APPROVED authentic pit-loom variation, 1 REJECTED duplicate clay miniature trio) with curator notes and timestamps.
- **Rationale**:
  - Completely resolves duplicate upload detection: new live uploads of identical or visually similar images are accurately detected at 100% (or >80%) similarity and automatically routed to the Admin Moderation Queue with status `FLAGGED`.
  - Delivers a rich, multi-item moderation console for presentation and admin evaluation.

## 32. Route Scroll Restoration & Navigation Viewport Reset
- **Timestamp**: 2026-11-04 19:20:00 +06:00
- **Context**: In the React SPA, navigating from a scrolled-down page to any other route retained the user's previous vertical scroll position instead of landing them at the top of the new page. This disrupted the art-first digital gallery browsing experience when navigating from feed items to marketplace catalogs, artwork details, or dashboards.
- **Decision**:
  - Created [`client/src/components/common/ScrollToTop.tsx`](file:///e:/Nakshi/client/src/components/common/ScrollToTop.tsx) observing `pathname`, `search`, and `hash` via `useLocation()`.
  - On route change, immediately resets `window.scrollTo({ top: 0, left: 0, behavior: 'instant' })` and sets `document.documentElement.scrollTop = 0` / `document.body.scrollTop = 0`.
  - Added support for in-page anchor fragments (e.g., `#reviews` or `#specifications`), smoothly scrolling directly to the target element if a hash is present.
  - Mounted `<ScrollToTop />` inside `<BrowserRouter>` in [`client/src/App.tsx`](file:///e:/Nakshi/client/src/App.tsx).
- **Rationale**:
  - Enforces `DESIGN_DIRECTION.md` and `DESIGN.md` gallery presentation principles: newly visited pages always render from their prominent header, matted hero image, and breadcrumb navigation.
  - Verified across all viewports (Desktop Chrome, Tablet 768px, Mobile 360px) via automated Playwright test suite `e2e/scroll_to_top.spec.ts`.

## 33. Streamlined Homepage Discovery Feed & Removal of Stories Tray
- **Timestamp**: 2026-11-04 19:30:00 +06:00
- **Context**: The homepage previously rendered an artisan stories tray above the craft category filter pills. To streamline user exploration and focus immediately on the living heritage artwork feed without secondary avatar chrome, the stories tray was removed from the homepage view.
- **Decision**:
  - Removed `<ArtisanStoriesTray />` and its dynamic memoization hook from [`client/src/pages/HomePage.tsx`](file:///e:/Nakshi/client/src/pages/HomePage.tsx).
  - Kept the underlying component files ([`ArtisanStoriesTray.tsx`](file:///e:/Nakshi/client/src/components/feed/ArtisanStoriesTray.tsx) and [`StoryModal.tsx`](file:///e:/Nakshi/client/src/components/feed/StoryModal.tsx)) intact in `client/src/components/feed/` to preserve code modularity.
  - Positioned the Craft Category filter pills (`All Crafts`, `Handloom Jamdani`, `Nakshi Kantha`, etc.) directly beneath the welcome banner, leading immediately into the artwork post stream.
  - Updated automated Playwright test suite [`e2e/homepage_feed.spec.ts`](file:///e:/Nakshi/e2e/homepage_feed.spec.ts) to verify the absence of the stories tray and proper category filtering.
- **Rationale**:
  - Fulfills the "Art-First Minimalism" principle from `DESIGN_DIRECTION.md`: eliminates visual clutter and puts authentic Bengali craft pieces front and center upon page load.
  - Reduces initial homepage JavaScript bundle size from 613.2 kB to 602.7 kB.





## 34. Dedicated Fine Art Painting Exhibitions & Curator Ownership Harmonization
- **Timestamp**: 2026-11-04 20:45:00 +06:00
- **Context**: The virtual exhibitions catalog (`/exhibitions`) was previously flooded with empty dummy exhibitions (7 records with 0 linked artworks and external Unsplash photo banners), and the VIP exclusive preview filter tab failed to return records due to missing `vipEndTime` definitions. Additionally, exhibitions reused existing craft artworks from the marketplace gallery rather than presenting distinct fine art collections.
- **Decision**:
  - **Purged Obsolete Dummy Exhibitions**: Enhanced [`server/prisma/clean-test-data.ts`](file:///e:/Nakshi/server/prisma/clean-test-data.ts) to detect and purge all exhibitions having 0 linked artworks or referencing external Unsplash banners (`images.unsplash.com`), cleaning up legacy dummy records.
  - **Dedicated Modern & Contemporary Paintings Collection**: Seeded 12 new original fine art paintings (oil on canvas, contemporary acrylics, riverine impressionist watercolors, and tactile earth pigment bas-reliefs) bundled directly into `client/public/images/paintings/` with authentic 64-bit Sharp dHashes, ensuring zero repetition with the 26 craft items in the main marketplace gallery.
  - **Curated 6 Thematic Virtual Exhibitions**:
    1. *Threads of Bengal: Tapestry & Modern Fiber Canvas* (ACTIVE / Live Hall, 3 paintings, curator Naveed Chowdhury)
    2. *Bengal Modernism: Avant-Garde Voices & Abstract Horizons* (VIP_EXCLUSIVE / VIP Preview, 2 paintings, curator Naveed Chowdhury, `vipStartTime` to `vipEndTime` active window)
    3. *Monsoon Melodies: Riverine Watercolors & Impressionism* (ACTIVE / Live Hall, 3 paintings, curator Naveed Chowdhury, Complimentary Free Admission)
    4. *Dhaka Neo-Expressionism: Urban Vibrance & Contemporary Forms* (ACTIVE / Live Hall, 2 paintings, curator Naveed Chowdhury)
    5. *Lost Horizons: Sculptural Relief & Earth Pigment Canvases* (UPCOMING, 3 paintings, curator Naveed Chowdhury)
    6. *Vernacular Modern: The Archival Scroll & Pastoral Retrospective* (CLOSED / Concluded Archive, 2 paintings, curator Dr. Anisur Rahman)
  - **Curator Naveed Ownership (5 of 6 Exhibitions)**: Assigned 5 exhibitions to curator Naveed Chowdhury (`organizer@nakshi.test`), providing full administrative access to add, edit, modify, and delete virtual exhibitions directly from the Organizer Dashboard (`/dashboard/organizer`).
  - **Structured Wall Layouts & Curator Statements**: Embedded `layoutConfig.walls` and `layoutConfig.curatorNote` in JSON for all exhibitions, giving virtual rooms distinct exhibition walls and visitor statement cards.
- **Rationale**:
  - Delivers an art-first, museum-grade virtual exhibition experience across all filter tabs (`ALL`: 6, `ACTIVE`: 3, `VIP_EXCLUSIVE`: 1, `UPCOMING`: 1, `CLOSED`: 1).
  - Maintains 100% test compatibility with `e2e/05_exhibitions.spec.ts` and zero broken links.

## 35. Multi-Artwork Curated Exhibitions, Strict Organizer Ownership Enforcement, and Exhibition CRUD Suite
- **Timestamp**: 2026-11-04 21:20:00 +06:00
- **Context**: Exhibitions previously had only 1 artwork per wall (causing virtual rooms to feel sparse), and artworks in exhibitions were originally seeded under marketplace craft artisans (e.g. Rokeya Begum), violating the platform rule that curators can only curate artworks they own and preventing organizers from curating or managing their own paintings. Furthermore, organizers lacked UI and API mechanisms to update or delete existing exhibitions.
- **Decision**:
  - **24 Authentic Fine Art Paintings (4 Artworks per Exhibition)**:
    - Expanded the curated collection to 24 distinct fine art paintings across modernist geometric abstraction, riverine watercolors, impressionist storm seascapes, Old Dhaka neo-expressionism, and tactile sculptural bas-reliefs bundled in `client/public/images/paintings/` with 64-bit Sharp dHashes.
    - All 6 exhibitions now contain exactly 4 distinct paintings partitioned across 2 gallery walls (2 paintings per wall), eliminating single-artwork wall sparseness.
  - **Strict Organizer Ownership Architecture**:
    - Reassigned all 20 modern paintings to Curator Naveed Chowdhury (`organizer@nakshi.test`) and 4 historical paintings to Curator Dr. Anisur Rahman (`anisur@nakshi.test`).
    - Purged artisan clutter: verified that Rokeya Begum and other marketplace artisans own 0 exhibition paintings and retain their authentic handcrafted heritage craft items.
    - Backend enforcement in `server/src/services/exhibition.service.ts` strictly verifies that all `artworkIds` belong to the authenticated organizer (`artistId: organizerId`).
  - **Full Exhibition CRUD Management**:
    - Backend API: Registered `PUT /api/exhibitions/:id` and `DELETE /api/exhibitions/:id` with strict ownership checks (curator or Admin), date validation, wall reconfiguration, and cascaded cleanup.
    - Frontend: Implemented `ExhibitionService.updateExhibition` and `ExhibitionService.deleteExhibition`.
    - Components: Created `client/src/components/exhibition/EditExhibitionModal.tsx` pre-populated with exhibition metadata, schedule, walls, and only the organizer's owned fine art pieces.
    - Organizer Dashboard: Enhanced `OrganizerDashboardView.tsx` with Edit button, Delete button (with confirmation dialog), and live state synchronization.
  - **Automated Verification**:
    - Added dedicated Playwright E2E suite `e2e/organizer_exhibition_crud.spec.ts` testing authentication, owned artwork filtering, editing, creation, deletion, and backend unauthorized curation rejection.
- **Rationale**:
    - Provides a complete, robust curation workflow for organizers and museum curators while upholding zero-clutter separation between marketplace crafts and fine art exhibitions.
