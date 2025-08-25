# Admin Guide

## Setup
- Use `docker compose up --build` to start everything.
- Default seed creates a duplicate session with 24 boards and 12 pairs.

## Director Tools
- Movement editor: adjust rounds, arrow-switch, bye tables.
- Seat reassignment and board reallocation.
- Recalculate rankings. Lock/unlock results.
- Annotate rulings with reasons (audit trail).

## Exports
- PDF: recap sheets, traveler sheets, final rankings.
- CSV: results and rankings.
- ACBLscore-compatible export.

## Troubleshooting
- Backend health: GET `/api/health` should return `{ status: 'ok' }`.
- Database: ensure Postgres container is healthy.
- If ranks seem off, use Director → Recalculate. 