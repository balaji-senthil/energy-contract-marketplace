import { useEffect, useMemo, useState } from "react";
import ContractCards from "./components/ContractCards";
import ContractTable from "./components/ContractTable";
import { fetchContracts } from "./api/contractsApi";
import type { Contract } from "./types/contracts";

type LoadState = "idle" | "loading" | "success" | "error";

const App = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [status, setStatus] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadContracts = async () => {
    try {
      setStatus("loading");
      setErrorMessage(null);
      const data = await fetchContracts();
      setContracts(data);
      setStatus("success");
      setLastUpdated(new Date());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load contracts.";
      setErrorMessage(message);
      setStatus("error");
    }
  };

  useEffect(() => {
    void loadContracts();
  }, []);

  const resultCountLabel = useMemo(() => {
    if (status !== "success") {
      return "Contracts";
    }
    return `Contracts (${contracts.length})`;
  }, [contracts.length, status]);

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
          <button className="secondaryButton" onClick={loadContracts} type="button">
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

        {status === "loading" && <p className="statusMessage">Loading contracts...</p>}

        {status === "error" && (
          <div className="statusMessage statusError">
            <p>{errorMessage}</p>
            <button className="primaryButton" onClick={loadContracts} type="button">
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
