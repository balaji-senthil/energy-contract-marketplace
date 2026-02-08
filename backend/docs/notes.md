# Backend Notes: Design and Choices

## Overview
- FastAPI service focused on contract CRUD, comparison, filtering, and portfolio management.
- Async SQLAlchemy models and services keep database access centralized.
- Pydantic v2 schemas provide validation and response shapes across the API.

## API Structure
- Routers split by domain: contracts and portfolios.
- Pydantic request/response schemas define validation and response shapes.
- Health check endpoint is provided for uptime verification.
- Pagination and sorting are built into contract listing routes.

## Data Models
- SQLAlchemy models cover contracts, users, portfolios, and portfolio holdings.
- Portfolio holdings enforce uniqueness per portfolio/contract pair.
- Monetary and quantity fields use precision-friendly numeric columns.
- Portfolio timestamps are tracked for creation and updates.

## Database Diagram (Mermaid ERD)
![Database Diagram](db-diagram.png)



## Filtering and Search
- Filters are validated via `ContractFilters` and mapped to SQL query conditions.
- Supports energy type, price/quantity ranges, location, delivery dates, status, and search.
- Search matches location, energy type, and status text (case-insensitive).

## Sorting
- Sorting supports price, quantity, and delivery start with explicit direction.
- Sort parameters are modeled via `ContractSortBy` and `ContractSortDirection`.
- Defaults to ascending by id when no sort is supplied.

## Portfolio Workflows
- Portfolio creation is lazy and ensured per user on demand.
- Add/remove operations are idempotent and return structured holdings.
- Holdings are returned with full contract details ordered by most recent.
- Portfolio metrics are aggregated in SQL for totals and energy-type breakdown.

## Contract Comparison
- `/contracts/compare` accepts 2-3 contract ids and returns per-contract data plus comparison metrics.
- Response includes duration in days plus min/max/spread ranges for price, quantity, and duration.

## Infrastructure and Middleware
- CORS is enabled for the frontend origin.
- Lifespan startup ensures tables are present before serving requests.
- Database URL is configured via `DATABASE_URL` with async engine and session factory.

## Tests
- Pytest coverage targets contracts and portfolios endpoints.
- Tests validate filtering, sorting, compare behavior, and portfolio workflows.
- Fixtures provide an async client and seeded contracts for repeatable scenarios.

## Requirements Alignment
- CRUD contract APIs are implemented in `app/routers/contracts.py` with validation in `app/schemas.py`.
- Contract fields align to required attributes in `app/models.py` and `app/schemas.py`.
- Filtering and sorting requirements are covered via query params and `ContractFilters`.
- Pagination uses `offset`/`limit` on contract list endpoints.
- Portfolio add/remove is provided via `app/routers/portfolios.py` and `app/services/portfolios_service.py`.
- Portfolio metrics (totals, capacity, cost, weighted avg, breakdown) are calculated in `get_portfolio_metrics`.
- Pydantic validation is enforced across inputs, including range and date checks.
- CORS middleware is configured in `app/main.py` for frontend access.
- Contract comparison response shapes live in `app/schemas.py`.
