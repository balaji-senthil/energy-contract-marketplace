import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ContractCards from "./components/ContractCards";
import ContractComparisonPanel from "./components/ContractComparisonPanel";
import ContractFilters from "./components/ContractFilters";
import ContractLoadingSkeleton from "./components/ContractLoadingSkeleton";
import ContractTable from "./components/ContractTable";
import PortfolioBuilder from "./components/PortfolioBuilder";
import RefreshIcon from "./ui/RefreshIcon";
import { fetchContractComparison, fetchContracts } from "./api/contractsApi";
import {
  addContractToPortfolio,
  fetchPortfolio,
  fetchPortfolioMetrics,
  removeContractFromPortfolio,
} from "./api/portfolioApi";
import { formatCurrency } from "./utils/format";
import type {
  Contract,
  ContractApiFilters,
  ContractFilterState,
  ContractComparisonResponse,
  ContractSortState,
  PortfolioHolding,
  PortfolioMetrics,
} from "./types/contracts";
import { PRICE_RANGE, QUANTITY_RANGE } from "./constants/filters";

type LoadState = "idle" | "loading" | "success" | "error";
type ViewTab = "dashboard" | "contracts" | "portfolio";

const PORTFOLIO_USER_ID = 1;

const App = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [status, setStatus] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterErrorMessage, setFilterErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [portfolioStatus, setPortfolioStatus] = useState<LoadState>("idle");
  const [portfolioErrorMessage, setPortfolioErrorMessage] = useState<string | null>(null);
  const [portfolioHoldings, setPortfolioHoldings] = useState<PortfolioHolding[]>([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | null>(null);
  const [portfolioUpdatingIds, setPortfolioUpdatingIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [filters, setFilters] = useState<ContractFilterState>({
    energyTypes: [],
    status: "Any",
    priceMin: String(PRICE_RANGE.min),
    priceMax: String(PRICE_RANGE.max),
    quantityMin: String(QUANTITY_RANGE.min),
    quantityMax: String(QUANTITY_RANGE.max),
    location: "",
    deliveryStartFrom: "",
    deliveryEndTo: "",
  });
  const [sortState, setSortState] = useState<ContractSortState>({
    sortBy: "None",
    sortDirection: "asc",
  });
  const previousFiltersRef = useRef<ContractFilterState | null>(null);
  const previousSortRef = useRef<ContractSortState | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const isFirstLoadRef = useRef(true);
  const comparisonAbortControllerRef = useRef<AbortController | null>(null);
  const comparisonRequestIdRef = useRef(0);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [compareStatus, setCompareStatus] = useState<LoadState>("idle");
  const [compareErrorMessage, setCompareErrorMessage] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ContractComparisonResponse | null>(null);
  const [viewTab, setViewTab] = useState<ViewTab>("dashboard");

  const loadContracts = useCallback(
    async ({
      filters: apiFilters,
      isFilterRequest = false,
      isSortRequest = false,
    }: {
      filters?: ContractApiFilters;
      isFilterRequest?: boolean;
      isSortRequest?: boolean;
    } = {}) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

    try {
      if (isFilterRequest) {
        setIsFiltering(true);
      }
      if (isSortRequest) {
        setIsSorting(true);
      }
      if (!isFilterRequest && !isSortRequest) {
        setStatus("loading");
      }
      setErrorMessage(null);
      setFilterErrorMessage(null);
      const data = await fetchContracts({
        filters: apiFilters,
        offset: 0,
        limit: 50,
        signal: controller.signal,
      });
      if (requestIdRef.current !== requestId) {
        return;
      }
      setContracts(data);
      setStatus("success");
      setLastUpdated(new Date());
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      const message = error instanceof Error ? error.message : "Unable to load contracts.";
      if (isFilterRequest || isSortRequest) {
        setFilterErrorMessage(message);
      } else {
        setErrorMessage(message);
        setStatus("error");
      }
    } finally {
      // Only clear filtering state if this is still the latest request
      if (requestIdRef.current === requestId) {
        if (isFilterRequest) {
          setIsFiltering(false);
        }
        if (isSortRequest) {
          setIsSorting(false);
        }
      }
    }
  }, []);

  const loadComparison = useCallback(async (ids: number[]) => {
    if (ids.length < 2) {
      setComparison(null);
      setCompareStatus("idle");
      setCompareErrorMessage(null);
      return;
    }

    const requestId = comparisonRequestIdRef.current + 1;
    comparisonRequestIdRef.current = requestId;
    if (comparisonAbortControllerRef.current) {
      comparisonAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    comparisonAbortControllerRef.current = controller;

    try {
      setCompareStatus("loading");
      setCompareErrorMessage(null);
      const data = await fetchContractComparison({ ids, signal: controller.signal });
      if (comparisonRequestIdRef.current !== requestId) {
        return;
      }
      setComparison(data);
      setCompareStatus("success");
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      const message = error instanceof Error ? error.message : "Unable to compare contracts.";
      setCompareErrorMessage(message);
      setCompareStatus("error");
    }
  }, []);

  const resultCountLabel = useMemo(() => {
    if (status !== "success") {
      return "Contracts";
    }
    return `Contracts (${contracts.length})`;
  }, [contracts.length, status]);

  const matchingCount = status === "success" ? contracts.length : null;

  const contractStatusCounts = useMemo(() => {
    if (status !== "success") {
      return {
        available: 0,
        reserved: 0,
        sold: 0,
      };
    }
    return contracts.reduce(
      (acc, contract) => {
        if (contract.status === "Available") acc.available += 1;
        if (contract.status === "Reserved") acc.reserved += 1;
        if (contract.status === "Sold") acc.sold += 1;
        return acc;
      },
      { available: 0, reserved: 0, sold: 0 },
    );
  }, [contracts, status]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.energyTypes.length > 0) count += 1;
    if (filters.status !== "Any") count += 1;
    if (
      Number(filters.priceMin) > PRICE_RANGE.min ||
      Number(filters.priceMax) < PRICE_RANGE.max
    ) {
      count += 1;
    }
    if (
      Number(filters.quantityMin) > QUANTITY_RANGE.min ||
      Number(filters.quantityMax) < QUANTITY_RANGE.max
    ) {
      count += 1;
    }
    if (filters.deliveryStartFrom || filters.deliveryEndTo) count += 1;
    if (filters.location.trim().length >= 2) count += 1;
    return count;
  }, [filters]);
  const hasActiveSort = sortState.sortBy !== "None";

  const appliedFilters = useMemo<ContractApiFilters>(() => {
    const nextFilters: ContractApiFilters = {};
    if (filters.energyTypes.length > 0) {
      nextFilters.energy_types = filters.energyTypes;
    }
    if (filters.status !== "Any") {
      nextFilters.status = filters.status;
    }
    const priceMin = Number.parseFloat(filters.priceMin);
    const priceMax = Number.parseFloat(filters.priceMax);
    const quantityMin = Number.parseFloat(filters.quantityMin);
    const quantityMax = Number.parseFloat(filters.quantityMax);
    if (!Number.isNaN(priceMin) && priceMin > PRICE_RANGE.min) {
      nextFilters.price_min = priceMin;
    }
    if (!Number.isNaN(priceMax) && priceMax < PRICE_RANGE.max) {
      nextFilters.price_max = priceMax;
    }
    if (!Number.isNaN(quantityMin) && quantityMin > QUANTITY_RANGE.min) {
      nextFilters.quantity_min = quantityMin;
    }
    if (!Number.isNaN(quantityMax) && quantityMax < QUANTITY_RANGE.max) {
      nextFilters.quantity_max = quantityMax;
    }
    const location = filters.location.trim();
    if (location.length >= 2) {
      nextFilters.location = location;
    }
    if (filters.deliveryStartFrom) {
      nextFilters.delivery_start_from = filters.deliveryStartFrom;
    }
    if (filters.deliveryEndTo) {
      nextFilters.delivery_end_to = filters.deliveryEndTo;
    }
    if (sortState.sortBy !== "None") {
      nextFilters.sort_by = sortState.sortBy;
      nextFilters.sort_direction = sortState.sortDirection;
    }
    return nextFilters;
  }, [filters, sortState]);

  const portfolioContractIds = useMemo(() => {
    return new Set(portfolioHoldings.map((holding) => holding.contract.id));
  }, [portfolioHoldings]);

  const selectedCompareIds = useMemo(() => new Set(compareIds), [compareIds]);
  const isCompareSelectionFull = compareIds.length >= 3;

  const portfolioBreakdown = portfolioMetrics?.breakdown_by_energy_type ?? [];
  const breakdownTotals = useMemo(() => {
    if (!portfolioBreakdown.length) {
      return {
        totalCapacity: 0,
        totalCost: 0,
      };
    }
    return portfolioBreakdown.reduce(
      (acc, item) => {
        acc.totalCapacity += Number(item.total_capacity_mwh) || 0;
        acc.totalCost += Number(item.total_cost) || 0;
        return acc;
      },
      { totalCapacity: 0, totalCost: 0 },
    );
  }, [portfolioBreakdown]);

  const deliveryInsights = useMemo(() => {
    if (contracts.length === 0) {
      return null;
    }
    const startDates = contracts
      .map((contract) => new Date(contract.delivery_start))
      .filter((date) => !Number.isNaN(date.getTime()));
    const endDates = contracts
      .map((contract) => new Date(contract.delivery_end))
      .filter((date) => !Number.isNaN(date.getTime()));
    if (startDates.length === 0 || endDates.length === 0) {
      return null;
    }
    const earliestStart = new Date(Math.min(...startDates.map((date) => date.getTime())));
    const latestEnd = new Date(Math.max(...endDates.map((date) => date.getTime())));
    const durationSummary = contracts.reduce(
      (acc, contract) => {
        const start = new Date(contract.delivery_start).getTime();
        const end = new Date(contract.delivery_end).getTime();
        if (Number.isNaN(start) || Number.isNaN(end)) {
          return acc;
        }
        acc.totalDays += (end - start) / (1000 * 60 * 60 * 24);
        acc.validCount += 1;
        return acc;
      },
      { totalDays: 0, validCount: 0 },
    );
    const avgDurationDays =
      durationSummary.validCount > 0
        ? Math.round(durationSummary.totalDays / durationSummary.validCount)
        : 0;
    return {
      earliestStart,
      latestEnd,
      avgDurationDays,
    };
  }, [contracts]);

  const loadPortfolio = useCallback(async () => {
    try {
      setPortfolioStatus("loading");
      setPortfolioErrorMessage(null);
      const [portfolio, metrics] = await Promise.all([
        fetchPortfolio(PORTFOLIO_USER_ID),
        fetchPortfolioMetrics(PORTFOLIO_USER_ID),
      ]);
      setPortfolioHoldings(portfolio.holdings);
      setPortfolioMetrics(metrics);
      setPortfolioStatus("success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load portfolio.";
      setPortfolioErrorMessage(message);
      setPortfolioStatus("error");
    }
  }, []);

  useEffect(() => {
    // adding 250ms delay to avoid rapid loading of contracts when filters are changed
    const delay = isFirstLoadRef.current ? 0 : 250;
    // now we are having two requests, one for filters and one for sort
    const previousFilters = previousFiltersRef.current ?? filters;
    const previousSort = previousSortRef.current ?? sortState;
    const isSortRequest =
      !isFirstLoadRef.current &&
      (previousSort.sortBy !== sortState.sortBy ||
        previousSort.sortDirection !== sortState.sortDirection);
    const isFilterRequest =
      !isFirstLoadRef.current &&
      (previousFilters.status !== filters.status ||
        previousFilters.priceMin !== filters.priceMin ||
        previousFilters.priceMax !== filters.priceMax ||
        previousFilters.quantityMin !== filters.quantityMin ||
        previousFilters.quantityMax !== filters.quantityMax ||
        previousFilters.location !== filters.location ||
        previousFilters.deliveryStartFrom !== filters.deliveryStartFrom ||
        previousFilters.deliveryEndTo !== filters.deliveryEndTo ||
        previousFilters.energyTypes.length !== filters.energyTypes.length ||
        previousFilters.energyTypes.some(
          (energyType, index) => energyType !== filters.energyTypes[index],
        ));
    previousFiltersRef.current = filters;
    previousSortRef.current = sortState;
    if (isFilterRequest) {
      setIsFiltering(true);
    }
    if (isSortRequest) {
      setIsSorting(true);
    }
    const handler = window.setTimeout(() => {
      void loadContracts({
        filters: appliedFilters,
        isFilterRequest,
        isSortRequest,
      });
      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
      }
    }, delay);

    return () => window.clearTimeout(handler);
  }, [appliedFilters, filters, loadContracts, sortState]);

  useEffect(() => {
    void loadPortfolio();
  }, [loadPortfolio]);

  useEffect(() => {
    void loadComparison(compareIds);
  }, [compareIds, loadComparison]);

  const handleAddToPortfolio = useCallback(
    async (contractId: number) => {
      if (portfolioContractIds.has(contractId) || portfolioUpdatingIds.has(contractId)) {
        return;
      }
      setPortfolioUpdatingIds((prev) => {
        const next = new Set(prev);
        next.add(contractId);
        return next;
      });
      try {
        await addContractToPortfolio(PORTFOLIO_USER_ID, contractId);
        await loadPortfolio();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to add contract to portfolio.";
        setPortfolioErrorMessage(message);
      } finally {
        setPortfolioUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(contractId);
          return next;
        });
      }
    },
    [loadPortfolio, portfolioContractIds, portfolioUpdatingIds],
  );

  const handleRemoveFromPortfolio = useCallback(
    async (contractId: number) => {
      if (portfolioUpdatingIds.has(contractId)) {
        return;
      }
      setPortfolioUpdatingIds((prev) => {
        const next = new Set(prev);
        next.add(contractId);
        return next;
      });
      try {
        await removeContractFromPortfolio(PORTFOLIO_USER_ID, contractId);
        await loadPortfolio();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to remove contract from portfolio.";
        setPortfolioErrorMessage(message);
      } finally {
        setPortfolioUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(contractId);
          return next;
        });
      }
    },
    [loadPortfolio, portfolioUpdatingIds],
  );

  const handleResetFilters = useCallback(() => {
    setFilters({
      energyTypes: [],
      status: "Any",
      priceMin: String(PRICE_RANGE.min),
      priceMax: String(PRICE_RANGE.max),
      quantityMin: String(QUANTITY_RANGE.min),
      quantityMax: String(QUANTITY_RANGE.max),
      location: "",
      deliveryStartFrom: "",
      deliveryEndTo: "",
    });
    setSortState({
      sortBy: "None",
      sortDirection: "asc",
    });
  }, []);

  const handleSortChange = useCallback((nextSort: ContractSortState) => {
    setSortState(nextSort);
  }, []);

  const handleToggleCompare = useCallback((contractId: number) => {
    setCompareIds((prev) => {
      if (prev.includes(contractId)) {
        return prev.filter((id) => id !== contractId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, contractId];
    });
  }, []);

  const handleClearComparison = useCallback(() => {
    setCompareIds([]);
  }, []);

  const handleRetryComparison = useCallback(() => {
    void loadComparison(compareIds);
  }, [compareIds, loadComparison]);

  const handleRefreshAll = useCallback(() => {
    void loadContracts({ filters: appliedFilters });
    void loadPortfolio();
  }, [appliedFilters, loadContracts, loadPortfolio]);

  return (
    <div className="appShell dashboardShell">
      <header className="topbar">
        <div className="topbarTitle">
          <h1>Energy Contract Marketplace</h1>
          <p className="subtitle">
            Live contract availability, deal comparison, and portfolio monitoring in
            one workspace.
          </p>
        </div>
        <div className="topbarActions">
          <div className="pageMeta">
            <p className="pageMetaLabel">Last sync</p>
            <p className="pageMetaValue">
              {lastUpdated ? lastUpdated.toLocaleTimeString("en-US") : "Not synced"}
            </p>
          </div>
          <button
            className="secondaryButton iconButton"
            onClick={handleRefreshAll}
            type="button"
            title="Refresh All"
            aria-label="Refresh All"
          >
            <RefreshIcon className="refreshIcon" />
          </button>
        </div>
      </header>

      <section className="workspaceCard">
        <div className="workspaceHeader">
          <div>
            <h2>Workspace</h2>
            <p className="sectionMeta">Switch views without losing your context.</p>
          </div>
          <nav className="menuTabs" aria-label="Workspace views">
            <button
              className={`menuTab ${viewTab === "dashboard" ? "menuTabActive" : ""}`}
              type="button"
              onClick={() => setViewTab("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`menuTab ${viewTab === "contracts" ? "menuTabActive" : ""}`}
              type="button"
              onClick={() => setViewTab("contracts")}
            >
              Contracts
            </button>
            <button
              className={`menuTab ${viewTab === "portfolio" ? "menuTabActive" : ""}`}
              type="button"
              onClick={() => setViewTab("portfolio")}
            >
              Portfolio
            </button>
          </nav>
        </div>

        {viewTab === "dashboard" && (
          <section className="dashboardView">
          <section className="statGrid statRow" aria-label="Portfolio pulse">
            <div className="statCard">
              <p className="statLabel">Portfolio pulse</p>
              <p className="statValue">
                {portfolioMetrics
                  ? formatCurrency(portfolioMetrics.weighted_avg_price_per_mwh)
                  : "—"}
              </p>
              <p className="statMeta">Weighted avg price / MWh</p>
            </div>
            <div className="statCard">
              <p className="statLabel">Active contracts</p>
              <p className="statValue">{status === "success" ? contracts.length : "—"}</p>
              <p className="statMeta">
                {status === "success" ? `${contractStatusCounts.available} available` : "—"}
              </p>
            </div>
            <div className="statCard">
              <p className="statLabel">Reserved</p>
              <p className="statValue">
                {status === "success" ? contractStatusCounts.reserved : "—"}
              </p>
              <p className="statMeta">Awaiting approval</p>
            </div>
            <div className="statCard">
              <p className="statLabel">Sold</p>
              <p className="statValue">
                {status === "success" ? contractStatusCounts.sold : "—"}
              </p>
              <p className="statMeta">Closed deals</p>
            </div>
            <div className="statCard">
              <p className="statLabel">Portfolio holdings</p>
              <p className="statValue">
                {portfolioStatus === "success" ? portfolioHoldings.length : "—"}
              </p>
              <p className="statMeta">Tracked contracts</p>
            </div>
          </section>

          <section className="insightsGrid" aria-label="Market insights">
            <div className="insightCard">
              <div className="insightHeader">
                <h3>Energy mix</h3>
                <p className="sectionMeta">Capacity distribution by energy type.</p>
              </div>
              {portfolioBreakdown.length === 0 && (
                <p className="asidePlaceholder">Add holdings to see your energy mix.</p>
              )}
              {portfolioBreakdown.length > 0 && (
                <div className="barList">
                  {portfolioBreakdown.map((item) => {
                    const capacity = Number(item.total_capacity_mwh) || 0;
                    const percentage =
                      breakdownTotals.totalCapacity > 0
                        ? Math.round((capacity / breakdownTotals.totalCapacity) * 100)
                        : 0;
                    return (
                      <div className="barRow" key={item.energy_type}>
                        <div className="barRowHeader">
                          <span>{item.energy_type}</span>
                          <span>{percentage}%</span>
                        </div>
                        <div className="barTrack">
                          <span style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="insightCard">
              <div className="insightHeader">
                <h3>Cost intensity</h3>
                <p className="sectionMeta">Cost per MWh by energy type.</p>
              </div>
              {portfolioBreakdown.length === 0 && (
                <p className="asidePlaceholder">Portfolio data needed for cost intensity.</p>
              )}
              {portfolioBreakdown.length > 0 && (
                <div className="barList">
                  {portfolioBreakdown.map((item) => {
                    const capacity = Number(item.total_capacity_mwh) || 0;
                    const cost = Number(item.total_cost) || 0;
                    const unitCost = capacity > 0 ? cost / capacity : 0;
                    const percentage =
                      breakdownTotals.totalCost > 0
                        ? Math.round((cost / breakdownTotals.totalCost) * 100)
                        : 0;
                    return (
                      <div className="barRow" key={item.energy_type}>
                        <div className="barRowHeader">
                          <span>{item.energy_type}</span>
                          <span>{formatCurrency(unitCost)}</span>
                        </div>
                        <div className="barTrack barTrackMuted">
                          <span style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="insightCard">
              <div className="insightHeader">
                <h3>Delivery horizon</h3>
                <p className="sectionMeta">Earliest to latest delivery window.</p>
              </div>
              {deliveryInsights ? (
                <>
                  <div className="timelineGrid">
                    <span className="timelineLabel">Start</span>
                    <div className="timelineBar" aria-hidden="true" />
                    <span className="timelineLabel timelineLabelRight">End</span>
                    <span className="timelineValue">
                      {deliveryInsights.earliestStart.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="timelineValue timelineValueCenter">
                      {deliveryInsights.avgDurationDays} days avg
                    </span>
                    <span className="timelineValue timelineValueRight">
                      {deliveryInsights.latestEnd.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </>
              ) : (
                <p className="asidePlaceholder">Contracts data needed for delivery range.</p>
              )}
            </div>

            <div className="insightCard">
              <div className="insightHeader">
                <h3>Market liquidity</h3>
                <p className="sectionMeta">Availability mix across the book.</p>
              </div>
              <div className="stackBar">
                <span
                  className="stackFill stackAvailable"
                  style={{
                    width:
                      status === "success" && contracts.length > 0
                        ? `${(contractStatusCounts.available / contracts.length) * 100}%`
                        : "0%",
                  }}
                />
                <span
                  className="stackFill stackReserved"
                  style={{
                    width:
                      status === "success" && contracts.length > 0
                        ? `${(contractStatusCounts.reserved / contracts.length) * 100}%`
                        : "0%",
                  }}
                />
                <span
                  className="stackFill stackSold"
                  style={{
                    width:
                      status === "success" && contracts.length > 0
                        ? `${(contractStatusCounts.sold / contracts.length) * 100}%`
                        : "0%",
                  }}
                />
              </div>
              <div className="stackLegend">
                {status === "success" ? (
                  <>
                    <span>Available {contractStatusCounts.available}</span>
                    <span>Reserved {contractStatusCounts.reserved}</span>
                    <span>Sold {contractStatusCounts.sold}</span>
                  </>
                ) : (
                  <>
                    <span>Available —</span>
                    <span>Reserved —</span>
                    <span>Sold —</span>
                  </>
                )}
              </div>
            </div>
          </section>
        </section>
        )}

        {viewTab === "contracts" && (
          <div className="tabPanel">
            <div className="sectionHeader">
              <div>
                <h2>{resultCountLabel}</h2>
                <p className="sectionMeta">View full contract details at a glance.</p>
              </div>
              <button
                className="secondaryButton iconButton"
                onClick={() => loadContracts({ filters: appliedFilters })}
                type="button"
                title="Refresh Contracts"
                aria-label="Refresh Contracts"
              >
                <RefreshIcon className="refreshIcon" />
              </button>
            </div>

            <ContractFilters
              filters={filters}
              sortState={sortState}
              hasActiveSort={hasActiveSort}
              activeFilterCount={activeFilterCount}
              isFiltering={isFiltering}
              isSorting={isSorting}
              matchingCount={matchingCount}
              onFiltersChange={setFilters}
              onSortChange={handleSortChange}
              onReset={handleResetFilters}
            />

            <ContractComparisonPanel
              selectedIds={compareIds}
              comparison={comparison}
              status={compareStatus}
              errorMessage={compareErrorMessage}
              onClear={handleClearComparison}
              onRetry={handleRetryComparison}
              onRemove={handleToggleCompare}
            />

            {filterErrorMessage && (
              <div className="statusMessage statusError">
                <p>{filterErrorMessage}</p>
                <button
                  className="primaryButton"
                  onClick={() => loadContracts({ filters: appliedFilters, isFilterRequest: true })}
                  type="button"
                >
                  Retry filters
                </button>
              </div>
            )}

            {status === "loading" && <ContractLoadingSkeleton />}

            {status === "error" && (
              <div className="statusMessage statusError">
                <p>{errorMessage}</p>
                <button
                  className="primaryButton"
                  onClick={() => loadContracts({ filters: appliedFilters })}
                  type="button"
                >
                  Try again
                </button>
              </div>
            )}

            {status === "success" && contracts.length === 0 && (
              <p className="statusMessage">No contracts available yet.</p>
            )}

            {status === "success" && contracts.length > 0 && (
              <>
                <ContractTable
                  contracts={contracts}
                  portfolioContractIds={portfolioContractIds}
                  updatingContractIds={portfolioUpdatingIds}
                  onAddToPortfolio={handleAddToPortfolio}
                  selectedCompareIds={selectedCompareIds}
                  isCompareSelectionFull={isCompareSelectionFull}
                  onToggleCompare={handleToggleCompare}
                />
                <ContractCards
                  contracts={contracts}
                  portfolioContractIds={portfolioContractIds}
                  updatingContractIds={portfolioUpdatingIds}
                  onAddToPortfolio={handleAddToPortfolio}
                  selectedCompareIds={selectedCompareIds}
                  isCompareSelectionFull={isCompareSelectionFull}
                  onToggleCompare={handleToggleCompare}
                />
              </>
            )}
          </div>
        )}

        {viewTab === "portfolio" && (
          <div className="tabPanel">
            <PortfolioBuilder
              holdings={portfolioHoldings}
              metrics={portfolioMetrics}
              status={portfolioStatus}
              errorMessage={portfolioErrorMessage}
              onRetry={loadPortfolio}
              onRemove={handleRemoveFromPortfolio}
              removingIds={portfolioUpdatingIds}
              variant="tab"
            />
          </div>
        )}
      </section>
    </div>
  );
};

export default App;
