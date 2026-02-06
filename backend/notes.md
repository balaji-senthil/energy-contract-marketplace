# Backend Notes: Design and Choices

## Overview
- FastAPI service focused on contract CRUD, filtering, and portfolio management.
- Async SQLAlchemy models and services keep database access centralized.

## API Structure
- Routers split by domain: contracts and portfolios.
- Pydantic request/response schemas define validation and response shapes.
- Health check endpoint is provided for uptime verification.

## Data Models
- SQLAlchemy models cover contracts, users, portfolios, and portfolio holdings.
- Portfolio holdings enforce uniqueness per portfolio/contract pair.
- Monetary and quantity fields use precision-friendly numeric columns.

## Database Diagram (Mermaid UML)
![Database Diagram](db-diagram.png)



## Filtering and Search
- Filters are validated via `ContractFilters` and mapped to SQL query conditions.
- Supports energy type, price/quantity ranges, location, delivery dates, status, and search.

## Portfolio Workflows
- Portfolio creation is lazy and ensured per user on demand.
- Add/remove operations are idempotent and return structured holdings.
- Portfolio metrics are aggregated in SQL for totals and energy-type breakdown.

## Infrastructure and Middleware
- CORS is enabled for the frontend origin.
- Lifespan startup ensures tables are present before serving requests.

## Requirements Alignment
- CRUD contract APIs are implemented in `app/routers/contracts.py` with validation in `app/schemas.py`.
- Contract fields align to required attributes in `app/models.py` and `app/schemas.py`.
- Filtering requirements are covered via query params and `ContractFilters`.
- Portfolio add/remove is provided via `app/routers/portfolios.py` and `app/services/portfolios_service.py`.
- Portfolio metrics (totals, capacity, cost, weighted avg, breakdown) are calculated in `get_portfolio_metrics`.
- Pydantic validation is enforced across inputs, including range and date checks.
- CORS middleware is configured in `app/main.py` for frontend access.
