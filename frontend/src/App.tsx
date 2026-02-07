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
type ActiveTab = "contracts" | "portfolio";

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
  const [activeTab, setActiveTab] = useState<ActiveTab>("contracts");

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
  
  const portfolioTabLabel = useMemo(() => {
    if (portfolioStatus !== "success") {
      return "Portfolio";
    }
    return `Portfolio (${portfolioHoldings.length})`;
  }, [portfolioHoldings.length, portfolioStatus]);
  
  const matchingCount = status === "success" ? contracts.length : null;

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
    <div className="appShell">
      <header className="hero">
        <div>
          <p className="eyebrow">Energy Contract Marketplace</p>
          <h1>Contract Browsing & Management</h1>
          <p className="subtitle">
            Browse current availability across energy types, quantities, and delivery
            windows.
          </p>
        </div>
        <div className="heroActions">
          <button
            className="secondaryButton iconButton"
            onClick={handleRefreshAll}
            type="button"
            title="Refresh All"
            aria-label="Refresh All"
          >
            <RefreshIcon className="refreshIcon" />
          </button>
          {lastUpdated && (
            <p className="lastUpdated">
              Updated {lastUpdated.toLocaleTimeString("en-US")}
            </p>
          )}
        </div>
      </header>

      <section className="contentCard">
        <div className="tabsToolbar">
          <div>
            <h2>Marketplace Workspace</h2>
            <p className="sectionMeta">
              Switch between contracts and your portfolio without losing context.
            </p>
          </div>
          <div className="tabs" role="tablist" aria-label="Marketplace views">
            <button
              className={`tabButton ${activeTab === "contracts" ? "tabButtonActive" : ""}`}
              id="tab-contracts"
              role="tab"
              aria-selected={activeTab === "contracts"}
              aria-controls="panel-contracts"
              type="button"
              onClick={() => setActiveTab("contracts")}
            >
              {resultCountLabel}
            </button>
            <button
              className={`tabButton ${activeTab === "portfolio" ? "tabButtonActive" : ""}`}
              id="tab-portfolio"
              role="tab"
              aria-selected={activeTab === "portfolio"}
              aria-controls="panel-portfolio"
              type="button"
              onClick={() => setActiveTab("portfolio")}
            >
              {portfolioTabLabel}
            </button>
          </div>
        </div>

        {activeTab === "contracts" && (
          <div className="tabPanel" role="tabpanel" id="panel-contracts" aria-labelledby="tab-contracts">
            <div className="sectionHeader">
              <div>
                <h3>{resultCountLabel}</h3>
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

        {activeTab === "portfolio" && (
          <div className="tabPanel" role="tabpanel" id="panel-portfolio" aria-labelledby="tab-portfolio">
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
