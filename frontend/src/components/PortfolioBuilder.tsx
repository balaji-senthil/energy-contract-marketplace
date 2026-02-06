import type { PortfolioHolding, PortfolioMetrics } from "../types/contracts";
import { formatCurrency, formatDate, formatNumber } from "../utils/format";

type LoadState = "idle" | "loading" | "success" | "error";

interface PortfolioBuilderProps {
  holdings: PortfolioHolding[];
  metrics: PortfolioMetrics | null;
  status: LoadState;
  errorMessage: string | null;
  onRetry: () => void;
  onRemove: (contractId: number) => void;
  removingIds: Set<number>;
}

const PortfolioBuilder = ({
  holdings,
  metrics,
  status,
  errorMessage,
  onRetry,
  onRemove,
  removingIds,
}: PortfolioBuilderProps) => {
  const hasHoldings = holdings.length > 0;
  const hasMetrics = metrics !== null;

  return (
    <section className="contentCard portfolioCard">
      <div className="sectionHeader">
        <div>
          <h2>Portfolio Builder</h2>
          <p className="sectionMeta">Track selected contracts and portfolio metrics.</p>
        </div>
        <button className="secondaryButton" onClick={onRetry} type="button">
          Refresh portfolio
        </button>
      </div>

      {status === "loading" && <p className="statusMessage">Loading portfolio...</p>}

      {status === "error" && (
        <div className="statusMessage statusError">
          <p>{errorMessage}</p>
          <button className="primaryButton" onClick={onRetry} type="button">
            Retry
          </button>
        </div>
      )}

      {status === "success" && errorMessage && (
        <div className="statusMessage statusError">
          <p>{errorMessage}</p>
          <button className="primaryButton" onClick={onRetry} type="button">
            Refresh
          </button>
        </div>
      )}

      {status === "success" && !hasHoldings && (
        <p className="statusMessage">
          No contracts in the portfolio yet. Add one from the list above.
        </p>
      )}

      {status === "success" && hasHoldings && (
        <div className="portfolioGrid">
          <div className="portfolioSummary">
            <h3>Portfolio Summary</h3>
            {hasMetrics && (
              <>
                <div className="metricsGrid">
                  <div className="metricCard">
                    <p className="metricLabel">Total contracts</p>
                    <p className="metricValue">{metrics.total_contracts}</p>
                  </div>
                  <div className="metricCard">
                    <p className="metricLabel">Total capacity</p>
                    <p className="metricValue">
                      {formatNumber(metrics.total_capacity_mwh)} MWh
                    </p>
                  </div>
                  <div className="metricCard">
                    <p className="metricLabel">Total cost</p>
                    <p className="metricValue">{formatCurrency(metrics.total_cost)}</p>
                  </div>
                  <div className="metricCard">
                    <p className="metricLabel">Weighted avg price</p>
                    <p className="metricValue">
                      {formatCurrency(metrics.weighted_avg_price_per_mwh)} / MWh
                    </p>
                  </div>
                </div>
                <div className="breakdownCard">
                  <p className="metricLabel">Breakdown by energy type</p>
                  <div className="breakdownList">
                    {metrics.breakdown_by_energy_type.map((item) => (
                      <div className="breakdownRow" key={item.energy_type}>
                        <div className="breakdownMeta">
                          <p className="breakdownName">{item.energy_type}</p>
                          <p className="breakdownValue">
                            {formatNumber(item.total_capacity_mwh)} MWh ·{" "}
                            {formatCurrency(item.total_cost)}
                          </p>
                        </div>
                        <div className="breakdownBar">
                          <span
                            style={{
                              width: `${Math.min(item.total_contracts * 20, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="portfolioHoldings">
            <h3>Selected Contracts</h3>
            <div className="tableWrapper">
              <table className="contractsTable portfolioTable">
                <thead>
                  <tr>
                    <th>Contract</th>
                    <th>Energy Type</th>
                    <th>Quantity (MWh)</th>
                    <th>Price / MWh</th>
                    <th>Delivery Window</th>
                    <th>Location</th>
                    <th>Added</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding) => (
                    <tr key={holding.id}>
                      <td>#{holding.contract.id}</td>
                      <td>{holding.contract.energy_type}</td>
                      <td>{formatNumber(holding.contract.quantity_mwh)}</td>
                      <td>{formatCurrency(holding.contract.price_per_mwh)}</td>
                      <td>
                        {formatDate(holding.contract.delivery_start)} -{" "}
                        {formatDate(holding.contract.delivery_end)}
                      </td>
                      <td>{holding.contract.location}</td>
                      <td>{formatDate(holding.added_at)}</td>
                      <td>
                        <button
                          className="dangerButton"
                          type="button"
                          onClick={() => onRemove(holding.contract.id)}
                          disabled={removingIds.has(holding.contract.id)}
                        >
                          {removingIds.has(holding.contract.id) ? "Removing..." : "Remove"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PortfolioBuilder;
