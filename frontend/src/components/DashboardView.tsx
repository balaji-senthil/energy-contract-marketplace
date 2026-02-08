import { BarChart, PieChart } from "@mui/x-charts";
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
  deliveryInsights,
}: DashboardViewProps) => {
  const isContractReady = status === "success";
  const isPortfolioReady = portfolioStatus === "success";
  const hasContracts = isContractReady && contractCount > 0;
  const hasPortfolioBreakdown = portfolioBreakdown.length > 0;

  const energyMixSeries = portfolioBreakdown.map((item) => ({
    id: item.energy_type,
    value: Number(item.total_capacity_mwh) || 0,
    label: item.energy_type,
  }));
  const costIntensityLabels = portfolioBreakdown.map((item) => item.energy_type);
  const costIntensitySeries = portfolioBreakdown.map((item) => {
    const capacity = Number(item.total_capacity_mwh) || 0;
    const cost = Number(item.total_cost) || 0;
    return capacity > 0 ? cost / capacity : 0;
  });
  const liquiditySeries = [
    { id: "available", value: contractStatusCounts.available, label: "Available" },
    { id: "reserved", value: contractStatusCounts.reserved, label: "Reserved" },
    { id: "sold", value: contractStatusCounts.sold, label: "Sold" },
  ];

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
            <div className="insightTitle">
              <h3>Energy mix</h3>
              <span className="insightBadge insightBadgePortfolio">Portfolio</span>
            </div>
            <p className="sectionMeta">Capacity distribution by energy type (MWh).</p>
          </div>
          {!hasPortfolioBreakdown && (
            <p className="asidePlaceholder">Add holdings to see your energy mix.</p>
          )}
          {hasPortfolioBreakdown && (
            <PieChart
              series={[
                {
                  data: energyMixSeries,
                  innerRadius: 50,
                  paddingAngle: 2,
                  cornerRadius: 4,
                },
              ]}
              height={220}
            />
          )}
        </div>

        <div className="insightCard">
          <div className="insightHeader">
            <div className="insightTitle">
              <h3>Cost intensity</h3>
              <span className="insightBadge insightBadgePortfolio">Portfolio</span>
            </div>
            <p className="sectionMeta">Cost per MWh by energy type.</p>
          </div>
          {!hasPortfolioBreakdown && (
            <p className="asidePlaceholder">Portfolio data needed for cost intensity.</p>
          )}
          {hasPortfolioBreakdown && (
            <BarChart
              xAxis={[{ scaleType: "band", data: costIntensityLabels }]}
              series={[
                {
                  data: costIntensitySeries,
                  valueFormatter: (value) => formatCurrency(value ?? 0),
                },
              ]}
              height={220}
            />
          )}
        </div>

        <div className="insightCard">
          <div className="insightHeader">
            <div className="insightTitle">
              <h3>Delivery horizon</h3>
              <span className="insightBadge insightBadgeContracts">Contracts</span>
            </div>
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
            <div className="insightTitle">
              <h3>Market liquidity</h3>
              <span className="insightBadge insightBadgeContracts">Contracts</span>
            </div>
            <p className="sectionMeta">Availability mix across the book.</p>
          </div>
          {!hasContracts && (
            <p className="asidePlaceholder">Contracts data needed for liquidity mix.</p>
          )}
          {hasContracts && (
            <PieChart
              series={[
                {
                  data: liquiditySeries,
                  innerRadius: 50,
                  paddingAngle: 2,
                  cornerRadius: 4,
                },
              ]}
              height={220}
            />
          )}
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
