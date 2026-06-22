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

## Quick Start (local development)

```bash
# 1. Start infrastructure (Postgres, Redis, MinIO)
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
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
- [ ] Datasheet engine · Formula engine · Uncertainty engine
- [ ] Report / Certificate / QR / Digital-signature engines
- [ ] CRM · Billing · Inventory · Notifications · Dashboard · Audit
