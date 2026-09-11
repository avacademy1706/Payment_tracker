# Payment Tracker

A production-grade payment tracking web application for managing clients, recurring monthly invoices, and partial payments — built to replace a manually-maintained Excel sheet with a proper relational data model and audit trail.

## 1. Architecture Summary

Monorepo with three workspaces:

```
/client   React 18 + TypeScript + Vite SPA (Tailwind CSS, shadcn/ui-style components, TanStack Query, React Hook Form + Zod, Recharts)
/server   Node.js + TypeScript + Express REST API (Mongoose/MongoDB, JWT auth via httpOnly cookie)
/shared   Plain TypeScript types (enums, domain interfaces, API envelope) imported by both client and server via relative paths — no build step, no package boundary
```

Key design decisions:

- **Client → Invoice → Payment**, never merged into one document. A client is billed monthly by creating a new `Invoice` (not a new client); a `Payment` is one transaction, and an invoice can have many.
- **Balance and status are always derived, never trusted from the client.** `Invoice.amountPaid` is a cache, recalculated from `sum(non-voided Payments)` inside the same MongoDB transaction as every payment write (`invoice.service.ts#recalculateInvoice`). `status` (Paid/Partial/Pending/Overdue) is never stored — it's computed on every read from `amountDue`, `amountPaid`, and `dueDate` by one pure function (`status.service.ts#computeStatus`), so the dashboard, the invoice list, the overdue view, and the Excel importer can never disagree with each other.
- **Recording a payment is a single MongoDB transaction**: insert the `Payment` + recompute the invoice's `amountPaid` atomically, so a mid-request crash can never leave the two out of sync.
- **Soft delete / archive, not destructive delete**, for clients and invoices; payments are voided (`isVoided`) rather than removed, preserving the audit trail.
- **Auto-generated, collision-free IDs.** `CL-0001…` and `INV-2026-0001…` come from an atomic Mongo counter (`$inc`), not `count() + 1`, so they can't collide under concurrent requests.
- **Local dev needs no MongoDB install.** If `MONGODB_URI` is unset, the server starts an in-memory MongoDB **replica set** (via `mongodb-memory-server`) automatically — a replica set rather than standalone, specifically so multi-document transactions work identically to production. On every boot it also bootstraps a login and a default business-settings document if none exist yet (idempotent, never touches Clients/Invoices/Payments) — see §7. Realistic demo *business* data (sample clients/invoices/payments) is a separate, explicit, opt-in step (`npm run seed`), never automatic. Production refuses to start without a real `MONGODB_URI`.
- **All day-boundary math (due dates, overdue, upcoming) is done in UTC**, not local time. Because due dates are constructed at UTC midnight, comparing them against local-time boundaries would make "is this overdue yet" depend on the server's timezone.

## 2. Database Schema Summary

| Model | Purpose | Key fields |
|---|---|---|
| `User` | Login accounts | `email` (unique), `passwordHash` (bcrypt), `role` (`admin`\|`staff`) |
| `Client` | One row per client, created once | `clientId` (auto, unique), `name`, `company`, `phone`, `email`, `service`, `monthlyFee`, `defaultDueDay`, `isActive` |
| `Invoice` | One row per client per billing month | `invoiceNumber` (auto, unique), `client` (ref), `billingMonth` ("YYYY-MM"), `invoiceDate`, `dueDate`, `amountDue`, `amountPaid` (cache), `isArchived`. Unique index on `(client, billingMonth)` for non-archived invoices — a client cannot be billed twice for the same month. |
| `Payment` | One row per transaction | `invoice` (ref), `client` (ref), `amount`, `paymentDate`, `paymentMode`, `transactionReference`, `remarks`, `isVoided` |
| `Settings` | Singleton business profile used on invoices | `businessName`, address/contact, `gstNumber`, `defaultDueDay`, etc. |
| `Counter` | Internal — atomic sequence source for `clientId`/`invoiceNumber` | `key`, `seq` |

Indexes: `clientId`, `invoiceNumber` (unique), `(client, billingMonth)` (unique, partial), `dueDate`, `paymentDate`, plus a text index on client name/company/email for search.

## 3. API Summary

All routes are under `/api`, JSON in/out, and (except `/api/auth/login`) require a valid session cookie. Full request/response shapes are in the route/controller files under `server/src/routes` and `server/src/controllers`.

```
POST   /api/auth/login                Sign in (rate-limited)
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/register             Admin-only — create a staff user

GET    /api/clients                   ?search=&page=&pageSize=&activeOnly=
POST   /api/clients
GET    /api/clients/:id
PUT    /api/clients/:id
DELETE /api/clients/:id               Archive (soft delete)
POST   /api/clients/:id/reactivate
GET    /api/clients/:id/invoices      ?year=&month=

GET    /api/invoices                  ?status=&clientId=&billingMonth=&search=&sort=&page=&pageSize=
POST   /api/invoices
GET    /api/invoices/:id
PUT    /api/invoices/:id
DELETE /api/invoices/:id              Archive
GET    /api/invoices/:id/payments
POST   /api/invoices/:id/recalculate  Force-recompute amountPaid from Payments

GET    /api/payments                  ?clientId=&invoiceId=&paymentMode=&dateFrom=&dateTo=
POST   /api/payments                  Record a payment (transactional; rejects overpayment)
GET    /api/payments/:id
PUT    /api/payments/:id
DELETE /api/payments/:id              Void (soft delete)

GET    /api/dashboard                 ?period=currentMonth|previousMonth|currentYear|custom
GET    /api/overdue                   ?page=&pageSize=
GET    /api/upcoming-dues             ?days=7|15|30

GET    /api/reports/monthly
GET    /api/reports/clients
GET    /api/reports/payment-modes

POST   /api/import/excel/preview      multipart file upload — validates only, writes nothing
POST   /api/import/excel/confirm      multipart file upload — commits inside one transaction

GET    /api/export/clients
GET    /api/export/payments
GET    /api/export/invoices           ?scope=all|currentMonth|overdue|outstanding|custom

GET    /api/settings
PUT    /api/settings
```

## 4. Setup Instructions

```bash
npm install          # installs all three workspaces from the repo root
npm run dev           # starts backend (:5000) and frontend (:5173) together
```

Open **http://localhost:5173**. That's it — no database install, no manual setup step: the backend auto-provisions an in-memory MongoDB and creates a login on first boot. The app starts with **no clients, invoices, or payments** — use the Clients page or Import / Export to add your own. See §7 for the login, and §10 if you want sample data loaded instead.

Run each side independently if needed: `npm run dev:server` / `npm run dev:client`.

## 5. Environment Variables

Copy `.env.example` → `.env` in `server/` (and `client/` if you need to override the API URL). None are required for local development — every value has a sane default — but review them before deploying:

**`server/.env`**
| Variable | Default | Notes |
|---|---|---|
| `NODE_ENV` | `development` | Set to `production` in deployment |
| `PORT` | `5000` | |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Used for CORS |
| `MONGODB_URI` | *(unset)* | **Required in production.** Leave unset in dev to auto-provision an in-memory DB |
| `JWT_SECRET` | placeholder | **Change this** before deploying — used to sign session tokens |
| `JWT_EXPIRES_IN` | `7d` | |
| `COOKIE_NAME` | `pt_token` | |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | see below | Only used by the seeding logic |

**`client/.env`**
| Variable | Default | Notes |
|---|---|---|
| `VITE_API_URL` | *(unset → `/api`, proxied by Vite)* | Set only if the API is served from a different origin in production |

## 6. Commands

Run from the repo root (each delegates to both workspaces):

```bash
npm run dev          # backend + frontend, both with hot reload
npm run build         # production build: server → server/dist, client → client/dist
npm run test           # backend test suite (Vitest)
npm run typecheck      # TypeScript, both workspaces, no emit
npm run lint            # ESLint, both workspaces
npm run seed            # WIPES all data and loads sample business data — optional, see §10
```

Production start, after `npm run build`: `npm start -w server` (serves the API on `PORT`), and serve `client/dist/` as static files from any web server or CDN, pointed at the API via `VITE_API_URL` at build time.

## 7. Login

```
email:    admin@paymenttracker.com
password: Admin@12345
```

This account is created automatically the first time the server starts against an empty database. The app itself starts with **no client, invoice, or payment data** — add your own via the Clients page, or import your Excel sheet from the Import / Export page (see §3 for the expected columns).

## 8. Implemented Features

- Email/password auth (bcrypt + JWT in an httpOnly cookie), protected routes, role field (admin/staff)
- Client CRUD with auto-generated `CL-0001…` IDs, search, active/archived filter, archive/reactivate
- Client profile: summary cards, full payment history with year/status filters
- Monthly invoicing: auto invoice numbers (`INV-2026-0001…`), auto due dates from a client's billing day (overridable), duplicate-invoice prevention
- Payment recording with true multi-transaction support (partial payments preserved as separate rows), overpayment rejected server-side
- Status always computed server-side (Paid/Partial/Pending/Overdue) with the exact priority rules from the spec, including the "partial-but-overdue" edge case
- Dashboard: stat cards, monthly revenue chart, status breakdown chart, top-outstanding table, period filter (current/previous month, current year, custom range)
- Dedicated Overdue view (days overdue, WhatsApp/email reminder links with pre-filled messages) and Upcoming Dues view (7/15/30-day windows)
- Reports: monthly collection, client-wise, payment-mode breakdown, date-range filterable
- Excel import: column validation, per-row error/duplicate detection, preview-before-commit, all-or-nothing transactional write, import summary
- Excel export: clients, payments, invoices (all/current month/overdue/outstanding)
- Printable invoice/receipt view (browser print → PDF)
- Settings page for business profile (name, address, GST, currency, default terms) — separate from client data
- Server-side pagination, sorting, and search throughout; global input validation (Zod) on every write endpoint
- Responsive layout: collapsible sidebar on mobile, tables scroll rather than break
- Backend test suite (44 tests) covering balance/status calculations, partial payments, overdue math, duplicate-invoice prevention, Excel import validation, and dashboard aggregation

## 9. Known Limitations

- **Dev-tooling CVEs, not shipped to production:** `npm audit` flags Vite/Vitest dev-server vulnerabilities that would require a major-version bump (Vite 5→8, Vitest 2→5) to clear; these only affect the local dev/test tooling, not the deployed app, and weren't worth the churn late in this build.
- **Excel parsing uses SheetJS's own patched build, not the npm registry package.** `xlsx` on npm is frozen at an old version with known prototype-pollution/ReDoS CVEs; SheetJS ships real fixes only via their own CDN (`server/package.json` pins `xlsx` to `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` — a widely-used, SheetJS-recommended workaround for this exact situation). An `exceljs`-based alternative was tried first but crashes on workbooks saved as an Excel Table (`Insert > Table`), which is how `Client_Monthly_Payment_Record.xlsx` itself is formatted — there's a regression test for this exact case in `server/tests/integration/excelImport.integration.test.ts`.
- **Reminders open pre-filled links, not sent automatically** (per the spec — WhatsApp/email links, no messaging API integration).
- **No automated overdue-status cron/notification job** — status is always correct on read, but nothing proactively emails/pings anyone when an invoice becomes overdue.
- **Single business profile** — `Settings` is a singleton; the app isn't multi-tenant.
- **`npm run seed`** only reaches the database the *current* process connects to — it won't affect an already-running `npm run dev` process's auto-provisioned in-memory database (each process gets its own). Restart `npm run dev` first if you want the running app to pick up a fresh seed, or point both at a real `MONGODB_URI` to share one.

## 10. Optional: Load Sample Data

The app ships with a realistic demo dataset you can load any time you want something to click around — useful for a demo, or to sanity-check the dashboard/reports before importing real data. It is **never** loaded automatically.

```bash
npm run seed
```

This **wipes every Client, Invoice, and Payment** (and resets the login to the default above) and replaces them with 12 sample Indian clients, 6 months of invoices each (72 total), and 66 payments spanning every status (Paid, Partial, Pending, Overdue) and all six payment modes. If `npm run dev` is already running, restart it afterward (or before) so it connects to the same database — see the limitation above.
