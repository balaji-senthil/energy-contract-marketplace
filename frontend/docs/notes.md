# Frontend Notes: Design and Choices

## Overview
- Single-page React app that focuses on contract discovery, comparison, and portfolio management.
- Main layout is a topbar plus a workspace card with tabs for Dashboard, Contracts, and Portfolio.
- Global refresh controls keep contracts and portfolio in sync.

## State and Data Flow
- App-level state owns contracts, filters, and portfolio data to keep data fetching centralized.
- Child components are presentational and receive data + handlers as props.
- Filters are controlled inputs stored in `filters` state; API-ready filters are derived via memoization.
- Sorting is tracked alongside filters and applied in the same request payload.
- Comparison selections are tracked by contract IDs with a hard cap of three selections.
- Dashboard insights are derived from contracts and portfolio metrics (status counts, delivery range).

## Data Fetching
- Contracts and portfolio data are fetched via dedicated API modules for separation of concerns.
- AbortController and request IDs prevent out-of-order updates and allow cancellation of in-flight
  requests when filters change.
- Filter changes are debounced by 250ms to reduce rapid fetches.
- Comparison requests use a dedicated AbortController and status to avoid cross-contamination with
  the main list fetch.
- Sort changes are treated as independent requests to avoid blocking filter updates.

## UI Feedback
- Load states and error states are tracked separately for contracts and portfolio.
- Filtering has its own status and error message to avoid blocking the main list state.
- Last updated time is shown for freshness and clarity.
- Refresh buttons exist for both the overall workspace and the contracts list.
- Filter status shows active filter/sort icons and an updating spinner while requests run.
- Contracts list uses a dedicated skeleton component during initial loading to keep layout stable.

## Performance and Rendering
- `useCallback` stabilizes handlers and fetch functions to avoid unnecessary effects/rerenders.
- `useMemo` is used for derived values like result count and applied filters.
- Status counts, delivery insights, and portfolio breakdown data are memoized to limit churn.

## Portfolio Interactions
- Portfolio add/remove uses a Set of updating IDs to prevent duplicate actions.
- Portfolio metrics are fetched alongside holdings and displayed in the builder.
- Portfolio metrics power dashboard charts for energy mix and cost intensity.

## Component Structure
- `DashboardView` renders KPI cards and market insights visualizations.
- `ContractFilters` handles filter inputs and reset behavior.
- `ContractTable` and `ContractCards` render tabular and card views of the same data.
- `ContractComparisonPanel` renders comparison selection, metrics, and side-by-side table.
- `PortfolioBuilder` is responsible for summary and management of the current portfolio.

## Requirements Alignment
- Dashboard tab surfaces portfolio pulse, liquidity mix, and delivery horizon insights.
- Table/card view is supported via `ContractTable` and `ContractCards`.
- Key contract details are shown in both list views.
- Contract comparison supports selecting 2-3 contracts, fetching comparison metrics, and highlighting min/max differences.
- Filters use multiple input types: sliders for ranges, text inputs for search, multi-select energy type chips, and dropdown for Status select.
- Delivery date pickers auto-correct start/end ranges (and allow clearing) to prevent invalid windows.
- Filters are applied in near real time with a 250ms debounce.
- Clear filters is available via the reset action in `ContractFilters`.
- Matching result count is shown in the section header.
- Add/remove portfolio actions are wired on each contract.
- Portfolio summary includes totals, weighted avg price, and energy-type breakdown.
- Visual breakdown is implemented as a simple bar-style list.
- Responsive behavior is handled in CSS (layout and grid classes).

## Styling
- Uses class-based styling with semantic class names for layout and status messaging.
- Dashboard visuals use MUI Charts for pie and bar insights.
