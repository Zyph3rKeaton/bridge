# Senior-Friendly Bridge Scoring Device (PWA)

A tablet-first, offline-first bridge scoring device with a beautiful, accessible UI and production-ready backend.

## Quick Start

Prerequisites:
- Docker and Docker Compose
- 6–8 GB free disk space

One-click dev up:

```bash
docker compose up --build
```

Then open:
- Frontend PWA: http://localhost:3000
- Backend API: http://localhost:4000
- Postgres: localhost:5432 (inside Docker network)
- Redis: localhost:6379 (inside Docker network)

Default seed creates a demo duplicate session (24 boards, Mitchell, 12 pairs).

## Environment Variables

Copy `.env.example` to `.env` at project root or provide envs via Docker Compose.

Key vars:
- DATABASE_URL: Postgres connection string (Prisma)
- REDIS_URL: redis://redis:6379
- JWT_SECRET: secret for JWT auth
- DEVICE_PIN: simple PIN for kiosk devices (alt to JWT for local devices)
- NEXT_PUBLIC_API_BASE_URL: http://localhost:4000

## Monorepo Layout

- apps/frontend: Next.js 14 PWA (TypeScript, Tailwind, Zustand, shadcn/ui)
- apps/backend: NestJS (TypeScript), Prisma, PostgreSQL, Redis, WebSockets
- packages/ui: shared design tokens and components
- infra: Dockerfiles, scripts, CI
- docs: User Guide, Admin Guide, Architecture, Accessibility, Assumptions

## Why NestJS (instead of FastAPI)

- Shared language and types with the frontend.
- First-class WebSocket support (rankings live updates) and structured modular architecture.
- Prisma ecosystem fit for rapid iteration with migrations and seeding.

If you prefer Python/FastAPI, the architecture remains compatible; see `docs/architecture.md` for boundaries.

## Scripts

- docker compose up --build: full stack dev up
- pnpm -w install: install all workspace deps (optional outside Docker)

## License

MIT — see LICENSE.

## Grandma Quick Start

See `docs/user-guide.md` for the 1-page quick start card with screenshots. 