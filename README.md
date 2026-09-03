# Best Value

Phase 1 foundation for a scalable, multi-category marketplace. It is intentionally not yet a complete marketplace: authentication, catalog management, carts, and orders will be added in later phases.

## Architecture

```
Next.js frontend (frontend/) → REST API (backend/) → Prisma → MySQL
```

The browser only talks to the Express API. Database credentials and Prisma remain backend-only.

## Prerequisites

- Node.js 20.9+ (Node 24 is also supported)
- npm 10+
- MySQL 8+ running locally or remotely

## Install and configure

1. Install dependencies from the repository root:

   ```bash
   npm install
   ```

2. Create environment files:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

3. Create a MySQL database and least-privilege application user. Substitute a strong password before running this example:

   ```sql
   CREATE DATABASE best_value CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'best_value_user'@'localhost' IDENTIFIED BY 'replace-with-a-strong-password';
   GRANT ALL PRIVILEGES ON best_value.* TO 'best_value_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. Update `backend/.env` with its connection string:

   ```env
   DATABASE_URL="mysql://best_value_user:replace-with-a-strong-password@localhost:3306/best_value"
   JWT_SECRET=use-a-unique-random-value-at-least-32-characters-long
   FRONTEND_URL=http://localhost:3000
   ```

5. Generate the Prisma client and apply the checked-in initial migration:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

   For subsequent schema changes, run `npm run db:migrate -- --name meaningful_change_name` and commit the generated migration.

## Run locally

Start both applications:

```bash
npm run dev
```

- Frontend: <http://localhost:3000>
- API health check: <http://localhost:4000/api/health>

Or run them separately:

```bash
npm run dev --workspace=@best-value/frontend
npm run dev --workspace=@best-value/backend
```

## Environment variables

| File | Variable | Purpose |
| --- | --- | --- |
| `backend/.env` | `DATABASE_URL` | MySQL Prisma connection string; never expose it to the browser. |
| `backend/.env` | `PORT` | API port, default `4000`. |
| `backend/.env` | `NODE_ENV` | `development`, `test`, or `production`. |
| `backend/.env` | `FRONTEND_URL` | Exact browser origin allowed by CORS. |
| `backend/.env` | `JWT_SECRET` | Required authentication signing secret; use 32+ random characters. |
| `backend/.env` | `JWT_EXPIRES_IN` | JWT lifetime, default `7d`. |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | Public API base URL, default `http://localhost:4000/api`. |

## Phase 1 contents

- npm workspaces monorepo with Next.js App Router and Express TypeScript projects
- Tailwind-based responsive base UI, global navigation, category navigation, product-card component, API client, and auth context shell
- Express `GET /api/health` endpoint with CORS, Helmet, rate limiting, JSON limits, centralized errors, and a consistent response envelope
- Prisma/MySQL schema and initial migration for users, sellers, nested categories, products, images, flexible attributes, variants, carts, addresses, orders, reviews, and wishlists
- Product-level stock for simple products and variant-level stock for configurable products
- `OrderItem.unitPrice`, `totalPrice`, product-name, and SKU snapshots so historical orders do not depend on current catalog prices
- Object-storage-ready image URLs rather than binary image data in MySQL; Stripe-ready provider/reference fields without payment processing

## Phase 2 authentication

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/me`
- Bcrypt password hashing and Prisma-only database access from the Express backend
- Signed JWT session held in an HTTP-only, `SameSite=Lax` cookie. The cookie is `Secure` in production and never exposed to browser JavaScript or local storage.
- Registration, login, account, and logout UI at `/register`, `/login`, and `/account`

Before starting the backend, set a unique secret in `backend/.env`:

```env
JWT_SECRET=generate-a-unique-random-value-with-at-least-32-characters
```

## Phase 3 catalog

The public catalog is available at `/products`, data-driven category pages are available at `/categories/[slug]`, and public product details are available at `/products/[id]`.

After applying migrations, populate the local development catalog with fictional products and placeholder images:

```bash
npm run prisma:seed --workspace=@best-value/backend
```

The seed is idempotent for its named categories, attributes, seller, and product slugs. It only uses the database named by `backend/.env` and never accesses unrelated databases.

## Phase 4 cart and orders

Authenticated customers can add active products or variants to `/cart`, update or remove items, and place a simulated order from `/checkout`. Orders begin in `PENDING` status; no payment provider is connected. Order creation recalculates prices server-side, checks stock inside a serializable transaction, snapshots product/variant names and prices, decrements inventory, and clears the cart.

Available authenticated API routes:

- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:id`
- `DELETE /api/cart/items/:id`
- `DELETE /api/cart`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`

Frontend routes: `/cart`, `/checkout`, `/orders`, and `/orders/[id]`.

## Phase 6 payments and marketplace accounting

Phase 6 adds a Stripe test-mode payment foundation around the existing customer order:

- `POST /api/payments/create-checkout-session` creates a server-priced Checkout Session for the authenticated customer’s order.
- `POST /api/payments/webhook` verifies Stripe signatures against the raw request body and idempotently synchronizes payment/refund state.
- Payment status is separate from fulfillment status. Seller allocations snapshot gross merchandise value, platform fee rate/amount, and estimated seller net using Decimal-safe calculations.
- Seller transaction visibility is available at `GET /api/seller/transactions`; admin inspection/refund APIs are available under `/api/admin/payments`, `/api/admin/allocations`, and `/api/admin/orders/:id/refund`.

Configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `PLATFORM_FEE_PERCENT` in `backend/.env` with Stripe test credentials only. No Stripe Connect transfers or seller payouts are implemented.

## Phase 7 shipping and fulfillment

Phase 7 uses an internal development shipping catalog (`STANDARD` at $8 and `EXPRESS` at $20). Shipping is calculated server-side and charged once per seller fulfillment, so a two-seller Express order snapshots $40 shipping. The selected method name and final cost are stored on the order and each seller fulfillment.

Orders now create one `Fulfillment` per seller and `FulfillmentItem` rows for that seller's order items. Sellers can move their own fulfillments through `PENDING → PROCESSING → SHIPPED → DELIVERED`, add development carrier/tracking data, and view `/seller/transactions` alongside fulfillment APIs. Customer order details show separate seller shipments. No carrier APIs, labels, or inventory changes are triggered by fulfillment.

## Phase 8 search and discovery

The public catalog endpoint is the unified MySQL search API. It accepts `q` (or the legacy `search`), `category`/`categoryId` with descendants, seller ID or slug, comma-separated brands, `attributes=code:value,...`, `minPrice`, `maxPrice`, `sort`, `page`, and `pageSize` (maximum 50). Relevance is deterministic: exact/prefix/contains title matches rank highest, followed by brand, category, attribute, and description matches; ties use creation time and ID.

Search results remain database-filtered and active-only. `GET /api/search/suggestions` provides bounded public title/brand/category suggestions, `GET /api/products/:id/related` ranks same-category/brand/shared-attribute products, and `GET /api/products/trending` uses actual historical `OrderItem` quantities only (it returns no fabricated popularity). `SearchEvent` stores normalized, capped query text and an optional user ID for future analytics.

## Phase 9 recommendations and personalization

Authenticated product detail visits record one throttled `VIEW` interaction per product per 15 minutes, and successful cart additions record `ADD_TO_CART` interactions. `GET /api/recommendations/recent` returns the user’s own deduplicated active history; `GET /api/recommendations?limit=...` generates bounded deterministic recommendations from recent views, cart signals, purchases, categories, brands, and attributes. Purchased and currently-carted products are excluded, seller diversity is capped, and cold-start users receive actual trending products. No interaction history or user ID is accepted from the client, and no ML, embeddings, Redis, or external recommendation engine is used.

## Phase 5 marketplace operations

Phase 5 adds the first multi-seller workflows without introducing a separate service or payment provider:

- Seller onboarding at `/sell`, seller dashboard at `/seller`, product management at `/seller/products`, seller order views at `/seller/orders`, and public stores at `/sellers/[id]`.
- Seller-only authorization middleware verifies the authenticated role, seller profile, and suspension status before product, inventory, and order operations.
- Seller product APIs support draft/published/archived status, object-storage-ready image URLs, normalized attributes, product variants, and product- or variant-level inventory updates.
- Customer reviews are available at `GET/POST /api/products/:id/reviews` and can only be created after a purchase; the existing unique constraint prevents duplicate reviews.
- Admin foundation routes (`GET /api/admin/products` and `PATCH /api/admin/products/:id/status`) provide a small moderation surface for future administration UI.

No new migration was required for Phase 5: the existing `Seller`, `UserRole`, variant/attribute, seller-linked `OrderItem`, and `Review` schema already supported these workflows.

## Verification

```bash
npm run lint
npm run build
curl http://localhost:4000/api/health
```

`npm run db:migrate` needs a reachable MySQL instance; no database connection is needed for the health endpoint itself.

## Production readiness checklist

- Set a unique `JWT_SECRET` (32+ characters), a production `DATABASE_URL`, `NODE_ENV=production`, and an explicit HTTPS `FRONTEND_URL` (additional exact origins may be listed in `FRONTEND_URLS`). Never commit `.env` files.
- Run `npm run db:generate` and `npx prisma migrate deploy --schema backend/prisma/schema.prisma` against `best_value` before starting the API. Take verified database backups and test restore procedures.
- Deploy the backend and frontend at their final HTTPS URLs, then confirm CORS allows only those exact frontend origins. Cookies are HTTP-only, Secure in production, and SameSite=Lax; this assumes the UI and API are same-site deployments. Add a CSRF token/origin strategy if that topology changes.
- Configure Stripe test or live credentials only on the backend. Register the webhook endpoint with the matching signing secret and never place Stripe secrets in `NEXT_PUBLIC_*` variables.
- Bootstrap the first administrator by assigning `User.role=ADMIN` through a controlled database/migration procedure; never accept a role from the browser. Review admin audit logs regularly.
- Retain structured request/error logs without passwords, cookies, tokens, connection strings, or unnecessary personal data. Configure external log retention and alerting separately.
- Use TLS termination, network restrictions for MySQL, least-privilege database credentials, automated backups, dependency scanning (`npm audit`), and a deploy order of migration → backend → frontend.

## Phase 12 hardening notes

The API now fails closed for missing `DATABASE_URL`, short `JWT_SECRET` values, localhost production origins, and incomplete Stripe credential pairs. `FRONTEND_URLS` supports additional explicit comma-separated origins; credentialed wildcard CORS is never enabled.

Authentication remains an HTTP-only, Secure-in-production, SameSite=Lax cookie scoped to `/api`. This assumes the frontend and API are same-site; use a CSRF token/origin policy if the deployment becomes cross-site. Tokens are never stored in local storage or returned by APIs.

Structured JSON request/error logs include a request ID and exclude cookies, authorization headers, passwords, connection strings, and payment secrets. Helmet security headers, production HSTS, bounded JSON bodies, endpoint-specific rate limits, and HTTP(S)-only image URL validation are enabled.

Run `npm audit` before deployment and review advisories without blindly applying major upgrades. The current audit reports transitive Prisma, Express/qs, PostCSS, Next.js, and sharp advisories; a safe fix may require a major Next.js upgrade and should be evaluated separately. Deploy in this order: `prisma migrate deploy` against `best_value`, backend with production secrets, CORS/HTTPS verification, then frontend. Configure MySQL network restrictions, least-privilege credentials, backups/restore tests, and log retention with the hosting provider.
