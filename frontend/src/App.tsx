import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ContractCards from "./components/ContractCards";
import ContractComparisonPanel from "./components/ContractComparisonPanel";
import ContractFilters from "./components/ContractFilters";
import ContractLoadingSkeleton from "./components/ContractLoadingSkeleton";
import ContractTable from "./components/ContractTable";
import PortfolioBuilder from "./components/PortfolioBuilder";
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
  PortfolioHolding,
  PortfolioMetrics,
} from "./types/contracts";
import { PRICE_RANGE, QUANTITY_RANGE } from "./constants/filters";

type LoadState = "idle" | "loading" | "success" | "error";

const PORTFOLIO_USER_ID = 1;

const App = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [status, setStatus] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterErrorMessage, setFilterErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
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
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const isFirstLoadRef = useRef(true);
  const comparisonAbortControllerRef = useRef<AbortController | null>(null);
  const comparisonRequestIdRef = useRef(0);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [compareStatus, setCompareStatus] = useState<LoadState>("idle");
  const [compareErrorMessage, setCompareErrorMessage] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ContractComparisonResponse | null>(null);

  const loadContracts = useCallback(
    async ({
      filters: apiFilters,
      isFilterRequest = false,
    }: {
      filters?: ContractApiFilters;
      isFilterRequest?: boolean;
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
      } else {
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
      if (isFilterRequest) {
        setFilterErrorMessage(message);
      } else {
        setErrorMessage(message);
        setStatus("error");
      }
    } finally {
      // Only clear filtering state if this is still the latest request
      if (isFilterRequest && requestIdRef.current === requestId) {
        setIsFiltering(false);
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
    return nextFilters;
  }, [filters]);

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
    const handler = window.setTimeout(() => {
      void loadContracts({
        filters: appliedFilters,
        isFilterRequest: !isFirstLoadRef.current,
      });
      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
      }
    }, delay);

    return () => window.clearTimeout(handler);
  }, [appliedFilters, loadContracts]);

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
            className="secondaryButton"
            onClick={() => loadContracts({ filters: appliedFilters })}
            type="button"
          >
            Refresh
          </button>
          {lastUpdated && (
            <p className="lastUpdated">
              Updated {lastUpdated.toLocaleTimeString("en-US")}
            </p>
          )}
        </div>
      </header>

      <section className="contentCard">
        <div className="sectionHeader">
          <h2>{resultCountLabel}</h2>
          <p className="sectionMeta">View full contract details at a glance.</p>
        </div>

        <ContractFilters
          filters={filters}
          activeFilterCount={activeFilterCount}
          isFiltering={isFiltering}
          matchingCount={matchingCount}
          onFiltersChange={setFilters}
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
      </section>

      <PortfolioBuilder
        holdings={portfolioHoldings}
        metrics={portfolioMetrics}
        status={portfolioStatus}
        errorMessage={portfolioErrorMessage}
        onRetry={loadPortfolio}
        onRemove={handleRemoveFromPortfolio}
        removingIds={portfolioUpdatingIds}
      />
    </div>
  );
};

export default App;
