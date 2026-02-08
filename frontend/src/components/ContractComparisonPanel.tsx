import type { ContractComparisonResponse } from "../types/contracts";
import { formatCurrency, formatDateRange, formatNumber } from "../utils/format";
import StatusBadge from "../ui/StatusBadge";

type LoadState = "idle" | "loading" | "success" | "error";

interface ContractComparisonPanelProps {
  selectedIds: number[];
  comparison: ContractComparisonResponse | null;
  status: LoadState;
  errorMessage: string | null;
  onClear: () => void;
  onRetry: () => void;
  onRemove: (contractId: number) => void;
}

const isNearlyEqual = (value: number, target: number): boolean => {
  return Math.abs(value - target) < 0.000001;
};

const getRangeClass = (value: number, min: number, max: number): string => {
  if (isNearlyEqual(value, max)) {
    return "compareValueMax";
  }
  if (isNearlyEqual(value, min)) {
    return "compareValueMin";
  }
  return "";
};

const ContractComparisonPanel = ({
  selectedIds,
  comparison,
  status,
  errorMessage,
  onClear,
  onRetry,
  onRemove,
}: ContractComparisonPanelProps) => {
  const hasSelection = selectedIds.length > 0;
  const canCompare = selectedIds.length >= 2;

  return (
    <div className="comparisonCard">
      <div className="comparisonHeader">
        <div>
          <p className="eyebrow">Contract Comparison</p>
        </div>
        <div className="comparisonActions">
          <button
            className="secondaryButton compactButton"
            type="button"
            onClick={onClear}
            disabled={!hasSelection}
          >
            Clear selection
          </button>
        </div>
      </div>

      <div className="comparisonSelections">
        {hasSelection ? (
          <div className="comparisonChips">
            {selectedIds.map((contractId) => (
              <button
                className="comparisonChip"
                type="button"
                key={contractId}
                onClick={() => onRemove(contractId)}
              >
                #{contractId}
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="comparisonHint">Select up to three contracts to compare.</p>
        )}
      </div>

      {!canCompare && hasSelection && (
        <p className="statusMessage">Select one more contract to start comparing.</p>
      )}

      {canCompare && status === "loading" && (
        <p className="statusMessage">Loading comparison...</p>
      )}

      {canCompare && status === "error" && (
        <div className="statusMessage statusError">
          <p>{errorMessage}</p>
          <button className="primaryButton" type="button" onClick={onRetry}>
            Retry comparison
          </button>
        </div>
      )}

      {canCompare && status === "success" && comparison && (
        <>
          <div className="comparisonMetrics">
            <div className="comparisonMetric">
              <p className="metricLabel">Price spread</p>
              <p className="metricValue">{formatCurrency(comparison.metrics.price_per_mwh.spread)}</p>
            </div>
            <div className="comparisonMetric">
              <p className="metricLabel">Quantity spread</p>
              <p className="metricValue">
                {formatNumber(comparison.metrics.quantity_mwh.spread)} MWh
              </p>
            </div>
            <div className="comparisonMetric">
              <p className="metricLabel">Duration spread</p>
              <p className="metricValue">
                {formatNumber(comparison.metrics.duration_days.spread)} days
              </p>
            </div>
          </div>

          <div className="comparisonTableWrapper">
            <table className="comparisonTable">
              <thead>
                <tr>
                  <th>Contract</th>
                  <th>Energy Type</th>
                  <th>Quantity (MWh)</th>
                  <th>Price / MWh</th>
                  <th>Duration</th>
                  <th>Delivery Window</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {comparison.contracts.map((contract) => (
                  <tr key={contract.id}>
                    <td>#{contract.id}</td>
                    <td>{contract.energy_type}</td>
                    <td
                      className={getRangeClass(
                        contract.quantity_mwh,
                        comparison.metrics.quantity_mwh.min,
                        comparison.metrics.quantity_mwh.max,
                      )}
                    >
                      {formatNumber(contract.quantity_mwh)}
                    </td>
                    <td
                      className={getRangeClass(
                        contract.price_per_mwh,
                        comparison.metrics.price_per_mwh.min,
                        comparison.metrics.price_per_mwh.max,
                      )}
                    >
                      {formatCurrency(contract.price_per_mwh)}
                    </td>
                    <td
                      className={getRangeClass(
                        contract.duration_days,
                        comparison.metrics.duration_days.min,
                        comparison.metrics.duration_days.max,
                      )}
                    >
                      {formatNumber(contract.duration_days)} days
                    </td>
                    <td>{formatDateRange(contract.delivery_start, contract.delivery_end)}</td>
                    <td>{contract.location}</td>
                    <td>
                      <StatusBadge status={contract.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ContractComparisonPanel;
