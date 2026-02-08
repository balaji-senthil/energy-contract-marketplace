import { formatCurrency } from "../utils/format";
import type { PortfolioEnergyBreakdown, PortfolioMetrics } from "../types/contracts";

type LoadState = "idle" | "loading" | "success" | "error";

interface DeliveryInsights {
  earliestStart: Date;
  latestEnd: Date;
  avgDurationDays: number;
}

interface DashboardViewProps {
  status: LoadState;
  portfolioStatus: LoadState;
  contractCount: number;
  portfolioHoldingsCount: number;
  portfolioMetrics: PortfolioMetrics | null;
  contractStatusCounts: {
    available: number;
    reserved: number;
    sold: number;
  };
  portfolioBreakdown: PortfolioEnergyBreakdown[];
  breakdownTotals: {
    totalCapacity: number;
    totalCost: number;
  };
  deliveryInsights: DeliveryInsights | null;
}

const DashboardView = ({
  status,
  portfolioStatus,
  contractCount,
  portfolioHoldingsCount,
  portfolioMetrics,
  contractStatusCounts,
  portfolioBreakdown,
  breakdownTotals,
  deliveryInsights,
}: DashboardViewProps) => {
  const isContractReady = status === "success";
  const isPortfolioReady = portfolioStatus === "success";
  const hasContracts = isContractReady && contractCount > 0;

  return (
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
          <p className="statValue">{isContractReady ? contractCount : "—"}</p>
          <p className="statMeta">
            {isContractReady ? `${contractStatusCounts.available} available` : "—"}
          </p>
        </div>
        <div className="statCard">
          <p className="statLabel">Reserved</p>
          <p className="statValue">{isContractReady ? contractStatusCounts.reserved : "—"}</p>
          <p className="statMeta">Awaiting approval</p>
        </div>
        <div className="statCard">
          <p className="statLabel">Sold</p>
          <p className="statValue">{isContractReady ? contractStatusCounts.sold : "—"}</p>
          <p className="statMeta">Closed deals</p>
        </div>
        <div className="statCard">
          <p className="statLabel">Portfolio holdings</p>
          <p className="statValue">{isPortfolioReady ? portfolioHoldingsCount : "—"}</p>
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
                width: hasContracts
                  ? `${(contractStatusCounts.available / contractCount) * 100}%`
                  : "0%",
              }}
            />
            <span
              className="stackFill stackReserved"
              style={{
                width: hasContracts
                  ? `${(contractStatusCounts.reserved / contractCount) * 100}%`
                  : "0%",
              }}
            />
            <span
              className="stackFill stackSold"
              style={{
                width: hasContracts
                  ? `${(contractStatusCounts.sold / contractCount) * 100}%`
                  : "0%",
              }}
            />
          </div>
          <div className="stackLegend">
            {isContractReady ? (
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
  );
};

export default DashboardView;
