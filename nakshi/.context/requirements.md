# Nakshi — Project Requirements

## 1. Core Goals

The system must achieve the following high-level objectives:

1. **Provide a multi-vendor art and crafts marketplace**
   - Allow artists to create storefronts and publish artworks/products.
   - Allow buyers to discover, search, filter, and purchase available artworks.

2. **Provide a secure internal credit-based transaction system**
   - Use fictional internal credits instead of real payment gateways.
   - Support credit top-ups, purchases, auction transactions, exhibition access, and transaction history.

3. **Provide administrator-managed live auctions**
   - Administrators exclusively create, schedule, monitor, and close auctions.
   - Buyers participate through real-time bidding using internal credits.
   - Artists may submit artworks for consideration/participation but do not manage auctions.

4. **Provide virtual exhibitions**
   - Exhibition organizers can create exhibitions, select artworks, arrange gallery layouts, configure access pricing, and define VIP viewing windows.
   - Buyers can purchase access using credits and enter using generated access/ticket tokens.

5. **Protect the marketplace from duplicate artwork uploads**
   - Automatically evaluate uploaded artwork images for visual similarity.
   - Route artwork exceeding the configured duplicate threshold to administrator review before public marketplace visibility.

6. **Provide role-specific management and analytics**
   - Support Buyer, Artist, Exhibition Organizer, and Admin roles.
   - Provide each role with only the functionality and data it is authorized to access.

7. **Maintain secure, responsive, and reliable operation**
   - Protect authentication, user data, uploaded assets, and financial-like credit records.
   - Support responsive use down to 360px screen width.
   - Maintain appropriate performance, backup, validation, logging, and error-handling behavior.

---

## 2. Strict Constraints & Edge Cases

### 2.1 Platform & Architecture Constraints

- The application is a **web-based system** accessible through modern web browsers.
- The server environment must use **Node.js**.
- The primary database must be a **relational database**, with **PostgreSQL** as the project target.
- The system must enforce **Role-Based Access Control (RBAC)** on protected operations.
- Business routing/controllers must remain separated from core data/model logic.
- Database foreign keys and commonly searched fields must be appropriately indexed.
- Heavy artwork similarity processing must run through **background/asynchronous processing** so that it does not block the main application server.
- The developer may choose frameworks, libraries, ORM/query builders, frontend framework, storage implementation, and internal architecture as long as the required behavior is preserved.
- External packages are allowed where they provide appropriate functionality; there is no requirement to implement the entire system using only the language standard library.

### 2.2 Authentication & Authorization

- Passwords must never be stored as plaintext.
- Passwords must use a secure password-hashing mechanism such as bcrypt/Argon2.
- JWT/session-based authentication must protect authenticated operations.
- Expired or invalid authentication credentials must not provide access to protected endpoints.
- Every protected resource operation must verify both authentication and authorization.
- Users must not be able to modify or access another user's protected resources unless their role explicitly permits it.
- Session/token expiration must be handled gracefully.
- Password reset must use a secure verification mechanism.

### 2.3 Internal Credit System — Mandatory

- **No real payment gateway is required or permitted for this project implementation.**
- Do not integrate bKash, Nagad, cards, banks, or other real-money payment processing.
- Credits are fictional/internal platform credits.
- Users must be able to add dummy credits through a simulated top-up mechanism.
- Credit-changing operations must be recorded transactionally.
- A credit transaction must not leave the balance and transaction history inconsistent.
- The system must prevent spending more credits than the user's available balance.
- Negative balances must never occur as a result of normal system operations.
- Repeated requests must not accidentally charge the same purchase/auction/exhibition access more than once.

### 2.4 Marketplace Constraints

- Only available/approved artwork should be publicly purchasable.
- Artists can modify only their own storefronts and listings.
- A completed purchase must:
  1. deduct the buyer's credits,
  2. credit the seller appropriately,
  3. create an order/purchase record,
  4. update the artwork's availability.
- Purchase and credit operations must be handled atomically.
- Two buyers must not both successfully purchase a single artwork that is only available for one sale.
- Invalid prices, missing required artwork information, and unauthorized modifications must be rejected with human-readable errors.

### 2.5 Auction Constraints

- **Only Admin users can create and manage auctions.**
- Artists do not create, schedule, start, or close auctions.
- Artists may submit artwork for auction participation.
- An auction must have valid timing information, artwork, starting bid, and minimum bid increment.
- Bids must be validated on the server; client-side validation alone is insufficient.
- A bid that does not satisfy the minimum increment must be rejected.
- A buyer without sufficient credits must not be allowed to place a bid that exceeds their available balance.
- Bids must not be accepted after the auction has ended.
- Concurrent bids must be resolved consistently so that the stored highest bid is correct.
- Connected participants must receive auction state/bid updates in near real time.
- When an auction closes, the system must determine the winning bidder and process the corresponding credit transaction.
- The same auction result must not be processed more than once.
- If there are no valid bids, the auction must close without creating a false winner.
- Auction status must remain consistent across refreshes and connected clients.

### 2.6 Exhibition Constraints

- Only authorized Exhibition Organizers/Admins may create or manage exhibitions according to their permissions.
- An exhibition must have a valid schedule.
- Access prices must use internal credits only.
- Successful access purchase must generate a unique ticket/access token.
- A ticket must be associated with the correct user and exhibition.
- Expired or invalid tickets must not grant access.
- VIP access must only be permitted during its configured time window.
- A user must not be able to reuse a ticket in a way that violates its access rules.
- Exhibition analytics must be based on recorded system activity rather than fabricated values.
- Gallery layout changes must preserve the association between artworks and the exhibition.

### 2.7 Duplicate Artwork Detection Constraints

- Artwork images must be processed for visual similarity before public marketplace persistence/visibility.
- A perceptual hash or equivalent visual-similarity representation must be generated.
- Similarity must be checked against relevant existing artwork data.
- **If the similarity score exceeds 80%, the artwork must be hidden from the public marketplace and routed to the Admin review queue.**
- Flagged artwork must remain reviewable by an administrator.
- Admin review must provide the flagged upload and suspected matching artwork in a clear comparison interface.
- Admins must be able to approve or reject the flagged artwork.
- Admins must be able to override the automated classification.
- Similarity processing must not block the main request-processing thread.
- If similarity processing fails, the system must not silently publish an artwork that was supposed to be checked; it must enter an appropriate error/pending/review state.

### 2.8 Performance & Reliability Constraints

- Normal asset retrieval should remain within a few seconds under the project's expected concurrent-user conditions.
- Auction WebSocket/state updates should reach connected clients within a few seconds under normal conditions.
- The system should maintain approximately **99% server availability** over a standard operating month.
- Important database data must be backed up regularly.
- Search and frequently accessed relational fields must use appropriate indexes.
- Large image/similarity-processing workloads must not block normal API request handling.

### 2.9 Security Constraints

- All external API/network communication must use secure transport such as TLS 1.3 where applicable.
- Client and server inputs must be validated/sanitized.
- The system must protect against SQL injection and XSS.
- Uploaded files must be validated and handled safely.
- Authorization checks must be performed server-side.
- Sensitive authentication information must not appear in logs or client responses.
- Errors shown to users should not expose internal stack traces, database details, secrets, or implementation internals.

### 2.10 UI & Usability Constraints

- The UI must remain usable from **360px screen width** upward.
- Interactive elements must not disappear or become unusable at the minimum supported width.
- Standard operations should generally require fewer than four navigation steps from the primary menu where the requirement applies.
- Form errors must be human-readable and shown close to the relevant input.
- Marketplace, auction, exhibition, dashboard, and moderation interfaces must remain usable on both desktop and mobile layouts.

### 2.11 Important Edge Cases

The implementation must handle at least the following cases gracefully:

- Duplicate registration attempts.
- Invalid login credentials.
- Expired authentication tokens/sessions.
- Unauthorized access to another user's resource.
- Missing or invalid required form fields.
- Invalid/unsupported artwork files.
- Artwork upload interrupted or similarity processing failure.
- Duplicate artwork detected above the 80% threshold.
- Admin rejecting or approving a flagged duplicate.
- Artwork becoming unavailable while another buyer is attempting to purchase it.
- Insufficient buyer credits.
- Repeated purchase requests.
- Repeated credit/top-up requests.
- Auction bid arriving exactly as the auction closes.
- Multiple buyers submitting bids concurrently.
- Bid below the required increment.
- Bid submitted after auction closure.
- Auction ending with no bids.
- Auction winner lacking sufficient credits at final settlement, if the implementation permits balance changes during an auction.
- Duplicate auction settlement attempts.
- Invalid, expired, or mismatched exhibition ticket.
- Exhibition access attempted outside its schedule.
- VIP access attempted outside the configured VIP window.
- Exhibition or artwork deleted/disabled while related records still exist.
- Database/API failure during a credit-changing operation.
- WebSocket disconnection and reconnection during an active auction.
- Invalid or stale client-side auction state.
- Missing analytics events or partially recorded activity.

---

## 3. Acceptance Criteria (Definition of Done)

A feature/task is considered complete only when the relevant functional behavior, validation, authorization, persistence, error handling, and tests have been verified.

### 3.1 General

- [ ] The feature is implemented according to these requirements.
- [ ] The feature works through the actual application flow, not only through isolated/mock UI behavior.
- [ ] Required data is correctly persisted in PostgreSQL.
- [ ] Server-side validation is implemented for all important inputs.
- [ ] Authorization is enforced server-side.
- [ ] Invalid operations return clear, controlled errors.
- [ ] No sensitive information is exposed to the client or logs.
- [ ] Relevant automated/manual tests pass.
- [ ] No existing core functionality is broken by the change.

### 3.2 Authentication & RBAC

- [ ] Users can register and log in successfully.
- [ ] Passwords are stored using secure hashing and never as plaintext.
- [ ] Valid authentication credentials can access authorized protected operations.
- [ ] Expired/invalid credentials are rejected.
- [ ] Each role receives the appropriate dashboard and permissions.
- [ ] Unauthorized role actions are rejected server-side.
- [ ] Users cannot access or modify resources belonging to other users without permission.
- [ ] Password reset uses a secure verification flow.
- [ ] Session/token expiration works as configured.

### 3.3 Artist & Marketplace

- [ ] Artists can create, update, and manage their own profiles/storefronts.
- [ ] Artists can create and manage their own artwork listings.
- [ ] Buyers can browse, search, and filter available artworks.
- [ ] Artwork details display the required metadata and price.
- [ ] Only eligible/approved artwork is publicly purchasable.
- [ ] A successful purchase deducts the correct buyer credit amount.
- [ ] The seller receives the corresponding credits.
- [ ] An order/purchase record is created.
- [ ] Artwork availability is updated correctly.
- [ ] Double-purchase/race-condition attempts cannot result in two successful sales of a single-sale item.
- [ ] Insufficient-credit purchases are rejected without changing the buyer's balance.
- [ ] Failed purchases do not create partial credit/order state.

### 3.4 Internal Credit System

- [ ] Users can view their current credit balance.
- [ ] Dummy credit top-up works without contacting any real payment provider.
- [ ] Every balance-changing operation creates an appropriate transaction record.
- [ ] Transaction history contains enough information to trace the balance change.
- [ ] Invalid or repeated requests cannot create unintended duplicate credits/charges.
- [ ] Credit balances never become negative through valid application flows.
- [ ] Credit and related business records remain consistent after success or failure.

### 3.5 Auctions

- [ ] Only Admin users can create/manage auctions.
- [ ] Artists cannot create or administratively control auctions.
- [ ] Artists can submit eligible artwork for auction participation.
- [ ] Admins can configure auction artwork, timing, starting bid, and minimum increment.
- [ ] Upcoming and active auctions are visible to eligible buyers.
- [ ] Buyers can submit valid bids using available credits.
- [ ] Invalid/insufficient bids are rejected.
- [ ] Bids below the required increment are rejected.
- [ ] Bids submitted after auction closure are rejected.
- [ ] Concurrent bids are resolved consistently.
- [ ] Connected clients receive updated auction state within the expected few-second performance requirement under normal conditions.
- [ ] Refreshing the page does not corrupt or reset auction state.
- [ ] The auction closes according to its configured rules.
- [ ] The correct highest valid bid is retained.
- [ ] The correct winner is determined when applicable.
- [ ] Winner settlement is processed exactly once.
- [ ] An auction with no valid bids closes without creating a false winner.
- [ ] WebSocket/client disconnection does not corrupt the server-side auction state.

### 3.6 Virtual Exhibitions

- [ ] Authorized organizers can create and manage exhibitions.
- [ ] Exhibitions support title, description, schedule, selected artworks, access price, and gallery layout.
- [ ] Organizers can arrange artworks within the virtual gallery.
- [ ] Buyers can purchase exhibition access using internal credits.
- [ ] Successful access purchase generates a unique ticket/access token.
- [ ] The ticket is persisted and associated with the correct user and exhibition.
- [ ] Invalid tickets are rejected.
- [ ] Expired tickets are rejected.
- [ ] Tickets cannot bypass configured exhibition access rules.
- [ ] VIP access is restricted to its configured time window.
- [ ] Exhibition visitor/viewing activity is recorded for analytics.

### 3.7 Duplicate Detection & Moderation

- [ ] Artwork upload triggers visual similarity processing.
- [ ] The similarity representation is generated before the artwork becomes publicly available.
- [ ] Existing artwork is checked for similarity.
- [ ] A score **greater than 80%** causes the artwork to be hidden from public marketplace visibility.
- [ ] Artwork above the threshold appears in the Admin review queue.
- [ ] Admins can compare the flagged artwork with the suspected matching artwork.
- [ ] Admins can approve a flagged artwork.
- [ ] Admins can reject a flagged artwork.
- [ ] Admin decisions are persisted.
- [ ] Approved artwork becomes available according to normal marketplace rules.
- [ ] Rejected artwork does not become publicly available.
- [ ] Similarity processing failures do not silently bypass duplicate protection.
- [ ] Similarity processing does not block the main application server.

### 3.8 Notifications

- [ ] Buyers receive relevant outbid notifications.
- [ ] Auction status notifications are generated where required.
- [ ] Relevant purchase/order notifications are generated.
- [ ] Exhibition/ticket notifications are generated where applicable.
- [ ] Notifications do not reveal information to unauthorized users.

### 3.9 Analytics

- [ ] Artists can view sales/order/storefront statistics available to them.
- [ ] Organizers can view visitor traffic, average viewing time, ticket/access activity, and credit revenue.
- [ ] Admins can view appropriate platform-level information.
- [ ] Analytics are based on persisted system events/data.
- [ ] Users cannot access analytics belonging to another unauthorized role/user.

### 3.10 Security

- [ ] Passwords are securely hashed.
- [ ] Protected API endpoints reject unauthorized access.
- [ ] SQL injection protections are verified.
- [ ] XSS protections are verified.
- [ ] Uploaded files are validated and safely handled.
- [ ] Authorization checks exist on all sensitive server operations.
- [ ] Secure network transport is configured where applicable.
- [ ] Internal errors do not expose secrets, stack traces, or database details.

### 3.11 Responsive UI & Usability

- [ ] Core pages remain usable at 360px viewport width.
- [ ] Marketplace discovery works on mobile and desktop.
- [ ] Artwork details work on mobile and desktop.
- [ ] Buyer, Artist, Organizer, and Admin dashboards remain usable on supported widths.
- [ ] Auction interfaces remain usable during live updates.
- [ ] Virtual exhibition interfaces remain usable on supported devices.
- [ ] Admin duplicate-review interface clearly presents the flagged and suspected matching artwork.
- [ ] Form validation errors are human-readable and shown appropriately.
- [ ] Standard operations follow the intended low-navigation-step usability requirement.

### 3.12 Reliability & Maintainability

- [ ] Important database data has a tested backup mechanism.
- [ ] Foreign keys and major search fields are appropriately indexed.
- [ ] Business routing and data/model logic are separated.
- [ ] Processing functions are documented sufficiently for engineering review.
- [ ] Logging exists for important system failures and business events without exposing sensitive information.
- [ ] The system handles expected service/database failures without corrupting credit, order, auction, or ticket data.
- [ ] The project can be installed, configured, run, and tested from a clean development environment using the documented setup process.

---

## 4. Functional Scope Summary

### Buyer

- Browse/search/filter marketplace.
- View artwork and artist information.
- Manage internal credits.
- Purchase artworks.
- Participate in auctions.
- Purchase exhibition access.
- View purchases, tickets, credit transactions, and auction activity.
- Receive relevant notifications.

### Artist

- Manage artist profile and storefront.
- Create/manage artwork listings.
- Provide artwork metadata.
- View sales/storefront statistics.
- Submit artwork for admin-managed auctions.
- Receive credits from completed sales.

### Exhibition Organizer

- Create/manage exhibitions.
- Select and arrange artworks.
- Configure gallery layout.
- Configure access pricing and schedules.
- Configure VIP viewing periods.
- View exhibition analytics.

### Admin

- Manage users and platform content.
- Moderate artwork.
- Review duplicate-detection flags.
- Create/manage/schedule/close auctions.
- Select/manage auction artworks.
- Monitor active auctions.
- Override automated moderation decisions.

---

## 5. Suggested Technology Direction

The following is the preferred implementation direction, but framework/library choices remain flexible:

- **Frontend:** React.js / Next.js or equivalent.
- **Backend:** Node.js with Express.js, NestJS, or equivalent.
- **Database:** PostgreSQL.
- **Authentication:** JWT/session-based authentication with bcrypt/Argon2.
- **Real-time communication:** WebSocket/Socket.IO or equivalent.
- **Image storage:** Local/server storage for development or suitable object storage.
- **Duplicate detection:** pHash/dHash/aHash or another suitable visual-similarity method.
- **Background jobs:** Node.js workers, Redis/BullMQ, or equivalent where required.
- **Development:** Git/GitHub; Docker may be used if useful.

Technology selection must support the constraints and acceptance criteria above. The stack itself should not be changed merely for convenience if doing so would violate the required Node.js/PostgreSQL/web application environment.

---

## 6. Completion Standard

The project is considered **Done** only when:

1. All required core modules are implemented.
2. All mandatory constraints and edge cases are handled.
3. All applicable acceptance criteria pass.
4. Role-based access is verified.
5. Credit, purchase, auction, ticket, and moderation state changes are consistent and persistent.
6. Duplicate artwork detection and administrator review work end-to-end.
7. Security and responsive UI requirements are verified.
8. Automated/manual tests demonstrate that the implemented behavior matches these requirements.
9. The project can be run from a clean environment using the documented setup and test procedure.
