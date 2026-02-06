# Frontend Notes: Design and Choices

## Overview
- Single-page React app that focuses on contract discovery and portfolio management.
- Main layout is a hero header plus two primary sections: contracts list/filters and portfolio builder.

## State and Data Flow
- App-level state owns contracts, filters, and portfolio data to keep data fetching centralized.
- Child components are presentational and receive data + handlers as props.
- Filters are controlled inputs stored in `filters` state; API-ready filters are derived via memoization.

## Data Fetching
- Contracts and portfolio data are fetched via dedicated API modules for separation of concerns.
- AbortController and request IDs prevent out-of-order updates and allow cancellation of in-flight
  requests when filters change.
- Filter changes are debounced by 250ms to reduce rapid fetches.

## UI Feedback
- Load states and error states are tracked separately for contracts and portfolio.
- Filtering has its own status and error message to avoid blocking the main list state.
- Last updated time is shown for freshness and clarity.

## Performance and Rendering
- `useCallback` stabilizes handlers and fetch functions to avoid unnecessary effects/rerenders.
- `useMemo` is used for derived values like result count and applied filters.

## Portfolio Interactions
- Portfolio add/remove uses a Set of updating IDs to prevent duplicate actions.
- Portfolio metrics are fetched alongside holdings and displayed in the builder.

## Component Structure
- `ContractFilters` handles filter inputs and reset behavior.
- `ContractTable` and `ContractCards` render tabular and card views of the same data.
- `PortfolioBuilder` is responsible for summary and management of the current portfolio.

## Requirements Alignment
- Table/card view is supported via `ContractTable` and `ContractCards`.
- Key contract details are shown in both list views.
- Filters use multiple input types: sliders for ranges, text inputs for search, multi-select energy type chips, and dropdown for Status select.
- Filters are applied in near real time with a 250ms debounce.
- Clear filters is available via the reset action in `ContractFilters`.
- Matching result count is shown in the section header.
- Add/remove portfolio actions are wired on each contract.
- Portfolio summary includes totals, weighted avg price, and energy-type breakdown.
- Visual breakdown is implemented as a simple bar-style list.
- Responsive behavior is handled in CSS (layout and grid classes).

## Styling
- Uses class-based styling with semantic class names for layout and status messaging.
