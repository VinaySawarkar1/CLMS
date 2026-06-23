# CLMS — Calibration Laboratory Management System

Enterprise Calibration Laboratory Management System for **NABL accredited** /
**ISO 17025** compliant laboratories. CLMS manages the entire calibration
lifecycle — from customer enquiry to digitally signed certificate — replacing
Excel, Word, manual registers and paper records.

> **Status:** Foundation scaffold. This repository currently provides a runnable
> monorepo skeleton (backend API + database schema + frontend shell + infra).
> Modules are being built out incrementally per the architecture in
> [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Tech Stack

| Layer            | Technology                                              |
| ---------------- | ------------------------------------------------------- |
| Frontend         | React + TypeScript + Vite + Material UI + TanStack Query |
| Backend          | NestJS (TypeScript) — modular service architecture      |
| Database         | PostgreSQL                                              |
| ORM              | Prisma                                                  |
| Auth             | JWT + Refresh Tokens + Role-Based Access Control        |
| Object Storage   | S3-compatible (MinIO for self-hosting)                  |
| Caching / Jobs   | Redis / BullMQ                                           |
| Deployment       | Docker + Docker Compose                                 |

> The spec allows ASP.NET Core 9 as an alternative backend. This scaffold uses
> the unified-TypeScript option (NestJS + Prisma) for a single language across
> the stack.

## Monorepo Layout

```
clms/
├── backend/            NestJS API (modular services)
│   ├── prisma/         Prisma schema & migrations
│   └── src/modules/    Feature modules (auth, users, customers, instruments, jobs, ...)
├── frontend/           React + Vite + TS application shell
├── docs/               Architecture & module documentation
└── docker-compose.yml  Postgres + Redis + MinIO for local development
```

## Quick Start — one command (recommended)

Requires only **Docker Desktop**. Builds and runs the whole stack (Postgres,
Redis, MinIO, backend with auto-migrate + seed, frontend):

```bash
docker compose up --build
```

Then open **http://localhost:8080** and sign in with **admin@clms.local / admin123**.

(First run takes a few minutes to build images and pull bases. The backend
container automatically applies migrations and seeds the admin user + the 14
disciplines before serving on `:3000`; the frontend is served on `:8080`.)

## Quick Start — manual dev mode

For hot-reload development without containerizing the apps:

```bash
# 1. Infrastructure only
docker compose up -d postgres redis

# 2. Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npx ts-node prisma/seed.ts
npm run start:dev          # API on http://localhost:3000

# 3. Frontend
cd ../frontend
npm install
npm run dev                # UI on http://localhost:5173
```

## Roadmap

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full module roadmap,
workflow, and database design. Implemented so far:

- [x] Monorepo + infra scaffold
- [x] Prisma schema covering the major table groups
- [x] Auth service (JWT + refresh) & RBAC scaffolding
- [x] Core CRUD modules: Users, Customers, Instruments, Jobs
- [x] Formula engine (Excel-like parser/evaluator) + Datasheet module
- [x] Uncertainty engine (GUM: combined/expanded, coverage factor, Welch–Satterthwaite)
- [x] Certificate + QR verification + digital-signature workflow (immutability on final lock)
- [x] Engineers · Tasks (Kanban) · Dashboard widgets
- [x] Report engine (HTML/PDF-ready certificate rendering)
- [x] Billing (invoices + GST + payments) · Inventory · Notifications · Audit query API
- [x] Quality (NCR/CAPA) · Environmental monitoring (limit alerts) · Customer portal
- [x] Frontend: routed shell (Dashboard, Jobs, Customers, Task board) with TanStack Query
- [ ] Word/Excel export · datasheet grid UI · real notification providers
