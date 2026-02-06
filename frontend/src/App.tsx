import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ContractCards from "./components/ContractCards";
import ContractFilters from "./components/ContractFilters";
import ContractTable from "./components/ContractTable";
import { fetchContracts } from "./api/contractsApi";
import type { Contract, ContractApiFilters, ContractFilterState } from "./types/contracts";
import { PRICE_RANGE, QUANTITY_RANGE } from "./constants/filters";

type LoadState = "idle" | "loading" | "success" | "error";

const App = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [status, setStatus] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterErrorMessage, setFilterErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
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
  },[]);

  const resultCountLabel = useMemo(() => {
    if (status !== "success") {
      return "Contracts";
    }
    return `Contracts (${contracts.length})`;
  }, [contracts.length, status]);

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
          onFiltersChange={setFilters}
          onReset={handleResetFilters}
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

        {status === "loading" && <p className="statusMessage">Loading contracts...</p>}

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
            <ContractTable contracts={contracts} />
            <ContractCards contracts={contracts} />
          </>
        )}
      </section>
    </div>
  );
};

export default App;
