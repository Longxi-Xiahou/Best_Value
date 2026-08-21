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

## Verification

```bash
npm run lint
npm run build
curl http://localhost:4000/api/health
```

`npm run db:migrate` needs a reachable MySQL instance; no database connection is needed for the health endpoint itself.
