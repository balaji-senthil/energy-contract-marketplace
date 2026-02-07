import type { Contract } from "../types/contracts";
import { formatCurrency, formatDateRange, formatNumber } from "../utils/format";
import StatusBadge from "./StatusBadge";

interface ContractTableProps {
  contracts: Contract[];
  portfolioContractIds: Set<number>;
  updatingContractIds: Set<number>;
  onAddToPortfolio: (contractId: number) => void;
  selectedCompareIds: Set<number>;
  isCompareSelectionFull: boolean;
  onToggleCompare: (contractId: number) => void;
}

const ContractTable = ({
  contracts,
  portfolioContractIds,
  updatingContractIds,
  onAddToPortfolio,
  selectedCompareIds,
  isCompareSelectionFull,
  onToggleCompare,
}: ContractTableProps) => {
  return (
    <div className="tableWrapper">
      <table className="contractsTable">
        <thead>
          <tr>
            <th>Contract</th>
            <th>Energy Type</th>
            <th>Quantity (MWh)</th>
            <th>Price / MWh</th>
            <th>Delivery Window</th>
            <th>Location</th>
            <th>Status</th>
            <th>Portfolio</th>
            <th>Compare</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => {
            const isSelected = selectedCompareIds.has(contract.id);
            const isCompareDisabled = !isSelected && isCompareSelectionFull;
            return (
              <tr key={contract.id}>
              <td>#{contract.id}</td>
              <td>{contract.energy_type}</td>
              <td>{formatNumber(contract.quantity_mwh)}</td>
              <td>{formatCurrency(contract.price_per_mwh)}</td>
              <td>{formatDateRange(contract.delivery_start, contract.delivery_end)}</td>
              <td>{contract.location}</td>
              <td>
                <StatusBadge status={contract.status} />
              </td>
              <td>
                <button
                  className="primaryButton compactButton"
                  type="button"
                  onClick={() => onAddToPortfolio(contract.id)}
                  disabled={
                    contract.status !== "Available" ||
                    portfolioContractIds.has(contract.id) ||
                    updatingContractIds.has(contract.id)
                  }
                >
                  {updatingContractIds.has(contract.id)
                    ? "Adding..."
                    : portfolioContractIds.has(contract.id)
                      ? "In portfolio"
                      : contract.status === "Available"
                        ? "Add"
                        : "Unavailable"}
                </button>
              </td>
              <td>
                <label className="compareToggle">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleCompare(contract.id)}
                    disabled={isCompareDisabled}
                    title={isCompareDisabled ? "Maximum of 3 contracts can be selected" : "Compare"}
                  />
                </label>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ContractTable;
