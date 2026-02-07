# Energy Contract Marketplace

Browse, filter, and compare energy supply contracts, then build a portfolio with live metrics.

## Features
- Contract browsing with CRUD support.
- Filtering by energy type, price, quantity, location, and delivery dates.
- Portfolio builder with total cost, capacity, and weighted averages.
- Side-by-side contract comparison (2-3 contracts).

## Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: FastAPI (Python 3.11+) + SQLAlchemy 2.0
- Database: PostgreSQL 16
- Containerization: Docker Compose

## Project Structure
- `frontend/`: React UI and API client
- `backend/`: FastAPI app, database models, and SQL seeds
- `backend/sql/`: `schema.sql` and `seed.sql`
- `docker-compose.yml`: Full-stack local environment

## Notes
- Frontend notes: [`frontend/docs/notes.md`](frontend/docs/notes.md)
- Backend notes: [`backend/docs/notes.md`](backend/docs/notes.md)

## Quick Start (Docker Compose)
Prerequisites: Docker Desktop or Docker Engine + Compose.

1. Start services:
   - `docker compose up --build`
2. Open the app:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000`
   - API docs: `http://localhost:8000/docs`

The Postgres container auto-runs `backend/sql/schema.sql` and
`backend/sql/seed.sql` only on the first initialization of the `db_data` volume.

### Rerun seed after Docker is up
If you need to re-apply or add new contracts in the seed data to an existing database, use the
platform-specific scripts:

- macOS: `./scripts/seed-after-docker-mac.sh`
- Linux: `./scripts/seed-after-docker-linux.sh`
- Windows (PowerShell): `powershell -ExecutionPolicy Bypass -File scripts/seed-after-docker-windows.ps1`

## Local Development

### 1) Database
Prerequisites: PostgreSQL 16 (or newer).

1. Create the database:
   - `createdb energy_contracts`
2. Apply schema and seed data:
   - `psql -d energy_contracts -f backend/sql/schema.sql`
   - `psql -d energy_contracts -f backend/sql/seed.sql`

### 2) Backend (FastAPI)
Prerequisites: Python 3.11+.

1. Install dependencies:
   - `python -m venv .venv`
   - `source .venv/bin/activate`
   - `pip install -r backend/requirements.txt`
2. Run the API:
   - `cd backend`
   - `DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/energy_contracts`
   - `uvicorn app.main:app --reload --port 8000`

API docs: `http://localhost:8000/docs`

### 3) Frontend (React)
Prerequisites: Node.js 20+.

1. Install dependencies:
   - `cd frontend`
   - `npm install`
2. Run the dev server:
   - `npm run dev`

Frontend: `http://localhost:5173`

## Environment Variables

### Backend
- `DATABASE_URL` (optional): defaults to
  `postgresql+asyncpg://postgres:postgres@localhost:5432/energy_contracts`

### Frontend
- `VITE_API_URL` (optional): defaults to `http://localhost:8000`
- `PORT` (optional): defaults to `5173` when running via Dockerfile

## API Overview
Base URL: `http://localhost:8000`

### Contracts
- `GET /contracts`  
  Query params: `energy_types`, `price_min`, `price_max`, `quantity_min`,
  `quantity_max`, `location`, `delivery_start_from`, `delivery_end_to`,
  `status`, `search`, `offset`, `limit`
- `GET /contracts/{contract_id}`
- `POST /contracts`
- `PATCH /contracts/{contract_id}`
- `DELETE /contracts/{contract_id}`
- `GET /contracts/compare?ids=1&ids=2&ids=3`

### Portfolios
- `GET /portfolios/{user_id}`
- `GET /portfolios/{user_id}/metrics`
- `POST /portfolios/{user_id}/contracts/{contract_id}`
- `DELETE /portfolios/{user_id}/contracts/{contract_id}`

### Health
- `GET /health`

## Database Schema
SQL definitions are in `backend/sql/schema.sql`. Seed data is in
`backend/sql/seed.sql` (15 sample contracts).

## Assumptions and Decisions
- Single shared Postgres database with seeded sample contracts.
- Portfolio is keyed by `user_id` without authentication (MVP scope).
- CRUD endpoints return Pydantic-validated models.
