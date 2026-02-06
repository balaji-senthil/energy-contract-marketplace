import type { ContractFilterState, ContractStatus, EnergyType } from "../types/contracts";

interface ContractFiltersProps {
  filters: ContractFilterState;
  activeFilterCount: number;
  isFiltering: boolean;
  onFiltersChange: (next: ContractFilterState) => void;
  onReset: () => void;
}

const energyTypes: EnergyType[] = ["Solar", "Wind", "Natural Gas", "Nuclear", "Coal", "Hydro"];
const statusOptions: Array<ContractStatus | "Any"> = ["Any", "Available", "Reserved", "Sold"];

const ContractFilters = ({
  filters,
  activeFilterCount,
  isFiltering,
  onFiltersChange,
  onReset,
}: ContractFiltersProps) => {
  const toggleEnergyType = (value: EnergyType) => {
    const nextEnergyTypes = filters.energyTypes.includes(value)
      ? filters.energyTypes.filter((type) => type !== value)
      : [...filters.energyTypes, value];
    onFiltersChange({ ...filters, energyTypes: nextEnergyTypes });
  };

  const noFiltersApplied: boolean = activeFilterCount === 0;

  return (
    <div className="filtersCard">
      <div className="filtersHeader">
        <div>
          <p className="filtersEyebrow">Filters</p>
          <p className="filtersSubtitle">Refine by energy, price, delivery, and location.</p>
        </div>
        <div className="filtersActions">
          <div className={`filterStatus ${isFiltering ? "filterStatusActive" : ""}`}>
          <p className="filtersMeta">
          {isFiltering ? "Applying filters..." : noFiltersApplied ? 'No active filters' : "Filters synced"}
          </p>
        </div>
          <button 
            disabled={noFiltersApplied || isFiltering} 
            title= {noFiltersApplied ? 'No filters applied' : 'Clear all filters'}
            className="secondaryButton" 
            type="button" 
            onClick={onReset}
            >
              Clear all
          </button>
        </div>
      </div>

      <div className="filtersGrid">
        <div className="filterGroup filterGroupWide">
          <p className="filterLabel">Energy type</p>
          <div className="filterChipGroup" role="group" aria-label="Energy types">
            {energyTypes.map((energyType) => (
              <label
                className={`filterChip ${
                  filters.energyTypes.includes(energyType) ? "filterChipActive" : ""
                }`}
                key={energyType}
              >
                <input
                  type="checkbox"
                  checked={filters.energyTypes.includes(energyType)}
                  onChange={() => toggleEnergyType(energyType)}
                />
                {energyType}
              </label>
            ))}
          </div>
        </div>

        <div className="filterGroup">
          <p className="filterLabel">Status</p>
          <select
            className="filterSelect"
            value={filters.status}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                status: event.target.value as ContractStatus | "Any",
              })
            }
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="filterGroup filterGroupWide">
          <p className="filterLabel">Price per MWh</p>
          <div className="filterRange">
            <input
              className="filterInput"
              inputMode="decimal"
              placeholder="Min"
              type="number"
              min="0"
              value={filters.priceMin}
              onChange={(event) => onFiltersChange({ ...filters, priceMin: event.target.value })}
            />
            <span className="filterRangeSeparator">to</span>
            <input
              className="filterInput"
              inputMode="decimal"
              placeholder="Max"
              type="number"
              min="0"
              value={filters.priceMax}
              onChange={(event) => onFiltersChange({ ...filters, priceMax: event.target.value })}
            />
          </div>
        </div>

        <div className="filterGroup filterGroupWide">
          <p className="filterLabel">Quantity (MWh)</p>
          <div className="filterRange">
            <input
              className="filterInput"
              inputMode="decimal"
              placeholder="Min"
              type="number"
              min="0"
              value={filters.quantityMin}
              onChange={(event) =>
                onFiltersChange({ ...filters, quantityMin: event.target.value })
              }
            />
            <span className="filterRangeSeparator">to</span>
            <input
              className="filterInput"
              inputMode="decimal"
              placeholder="Max"
              type="number"
              min="0"
              value={filters.quantityMax}
              onChange={(event) =>
                onFiltersChange({ ...filters, quantityMax: event.target.value })
              }
            />
          </div>
        </div>

        <div className="filterGroup filterGroupWide">
          <p className="filterLabel">Delivery window</p>
          <div className="filterRange">
            <input
              className="filterInput"
              type="date"
              value={filters.deliveryStartFrom}
              onChange={(event) =>
                onFiltersChange({ ...filters, deliveryStartFrom: event.target.value })
              }
            />
            <span className="filterRangeSeparator">to</span>
            <input
              className="filterInput"
              type="date"
              value={filters.deliveryEndTo}
              onChange={(event) =>
                onFiltersChange({ ...filters, deliveryEndTo: event.target.value })
              }
            />
          </div>
        </div>

        <div className="filterGroup">
          <p className="filterLabel">Location</p>
          <input
            className="filterInput"
            placeholder="City, region, or hub"
            type="text"
            value={filters.location}
            onChange={(event) => onFiltersChange({ ...filters, location: event.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

export default ContractFilters;
