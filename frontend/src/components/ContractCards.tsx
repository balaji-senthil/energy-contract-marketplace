import type { Contract } from "../types/contracts";
import { formatCurrency, formatDateRange, formatNumber } from "../utils/format";
import StatusBadge from "./StatusBadge";

interface ContractCardsProps {
  contracts: Contract[];
  portfolioContractIds: Set<number>;
  updatingContractIds: Set<number>;
  onAddToPortfolio: (contractId: number) => void;
  selectedCompareIds: Set<number>;
  isCompareSelectionFull: boolean;
  onToggleCompare: (contractId: number) => void;
}

const ContractCards = ({
  contracts,
  portfolioContractIds,
  updatingContractIds,
  onAddToPortfolio,
  selectedCompareIds,
  isCompareSelectionFull,
  onToggleCompare,
}: ContractCardsProps) => {
  return (
    <div className="cardsGrid">
      {contracts.map((contract) => {
        const isSelected = selectedCompareIds.has(contract.id);
        const isCompareDisabled = !isSelected && isCompareSelectionFull;
        return (
          <article className="contractCard" key={contract.id}>
          <div className="cardHeader">
            <div>
              <p className="cardLabel">Contract</p>
              <p className="cardValue">#{contract.id}</p>
            </div>
            <StatusBadge status={contract.status} />
          </div>
          <div className="cardBody">
            <div>
              <p className="cardLabel">Energy Type</p>
              <p className="cardValue">{contract.energy_type}</p>
            </div>
            <div>
              <p className="cardLabel">Quantity</p>
              <p className="cardValue">{formatNumber(contract.quantity_mwh)} MWh</p>
            </div>
            <div>
              <p className="cardLabel">Price / MWh</p>
              <p className="cardValue">{formatCurrency(contract.price_per_mwh)}</p>
            </div>
            <div>
              <p className="cardLabel">Delivery Window</p>
              <p className="cardValue">
                {formatDateRange(contract.delivery_start, contract.delivery_end)}
              </p>
            </div>
            <div>
              <p className="cardLabel">Location</p>
              <p className="cardValue">{contract.location}</p>
            </div>
          </div>
          <div className="cardActions">
            <button
              className="secondaryButton compactButton"
              type="button"
              onClick={() => onToggleCompare(contract.id)}
              disabled={isCompareDisabled}
            >
              {isSelected ? "Selected" : "Compare"}
            </button>
            <button
              className="primaryButton"
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
                    ? "Add to Portfolio"
                    : "Unavailable"}
            </button>
          </div>
        </article>
        );
      })}
    </div>
  );
};

export default ContractCards;
