# Architecture

## Overview
- Frontend: Next.js PWA (TypeScript, Tailwind, Zustand).
- Backend: NestJS (TypeScript) with Prisma ORM (PostgreSQL), Redis for pub/sub.
- Realtime: WebSockets channels `event:{id}:rankings` and `table:{id}:status`.
- Offline-first: service worker caches UI and a local store queues mutations for background sync.

## Data Model
See `apps/backend/prisma/schema.prisma` for the full schema.

## Modules (Backend)
- Events/Sections/Tables/Pairs/Teams: CRUD and movement generation.
- Boards/Results: entry and validation; fouled boards; adjusted scores.
- Rankings: MP/IMPs/VPs calculation; snapshots persisted.
- Exports: PDF/CSV/ACBLscore mapping.
- Realtime: publish updates to Redis and WebSocket gateways.

## Choice Justification
NestJS chosen for shared TypeScript domain models, decorators, and WebSocket ergonomics. Prisma simplifies migrations and seeds.

## Boundaries
- Frontend does not directly query DB; uses `/api` endpoints.
- Scoring engine is a pure module, tested in isolation. 