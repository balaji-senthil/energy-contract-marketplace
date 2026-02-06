import type { ChangeEvent } from "react";
import type { ContractFilterState, ContractStatus, EnergyType } from "../types/contracts";
import { PRICE_RANGE, QUANTITY_RANGE } from "../types/contracts";
import { formatCurrency, formatNumber } from "../utils/format";

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
  const priceMinValue = Number.isNaN(Number(filters.priceMin))
    ? PRICE_RANGE.min
    : Number(filters.priceMin);
  const priceMaxValue = Number.isNaN(Number(filters.priceMax))
    ? PRICE_RANGE.max
    : Number(filters.priceMax);
  const quantityMinValue = Number.isNaN(Number(filters.quantityMin))
    ? QUANTITY_RANGE.min
    : Number(filters.quantityMin);
  const quantityMaxValue = Number.isNaN(Number(filters.quantityMax))
    ? QUANTITY_RANGE.max
    : Number(filters.quantityMax);

  const toggleEnergyType = (value: EnergyType) => {
    const nextEnergyTypes = filters.energyTypes.includes(value)
      ? filters.energyTypes.filter((type) => type !== value)
      : [...filters.energyTypes, value];
    onFiltersChange({ ...filters, energyTypes: nextEnergyTypes });
  };

  const handlePriceMinChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);
    // Keep min at or below current max to avoid crossing sliders.
    const clampedValue = Math.min(nextValue, priceMaxValue);
    onFiltersChange({ ...filters, priceMin: String(clampedValue) });
  };

  const handlePriceMaxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);
    // Keep max at or above current min to avoid crossing sliders.
    const clampedValue = Math.max(nextValue, priceMinValue);
    onFiltersChange({ ...filters, priceMax: String(clampedValue) });
  };

  const handleQuantityMinChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);
    // Keep min at or below current max to avoid crossing sliders.
    const clampedValue = Math.min(nextValue, quantityMaxValue);
    onFiltersChange({ ...filters, quantityMin: String(clampedValue) });
  };

  const handleQuantityMaxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);
    // Keep max at or above current min to avoid crossing sliders.
    const clampedValue = Math.max(nextValue, quantityMinValue);
    onFiltersChange({ ...filters, quantityMax: String(clampedValue) });
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
            <div className="filterRangeControl">
              <p className="filterRangeValue">Min {formatCurrency(priceMinValue)}</p>
              <input
                className="filterSlider"
                type="range"
                min={PRICE_RANGE.min}
                max={PRICE_RANGE.max}
                step={PRICE_RANGE.step}
                value={priceMinValue}
                onChange={handlePriceMinChange}
                aria-label="Minimum price per MWh"
              />
            </div>
            <span className="filterRangeSeparator">to</span>
            <div className="filterRangeControl">
              <p className="filterRangeValue">Max {formatCurrency(priceMaxValue)}</p>
              <input
                className="filterSlider"
                type="range"
                min={PRICE_RANGE.min}
                max={PRICE_RANGE.max}
                step={PRICE_RANGE.step}
                value={priceMaxValue}
                onChange={handlePriceMaxChange}
                aria-label="Maximum price per MWh"
              />
            </div>
          </div>
        </div>

        <div className="filterGroup filterGroupWide">
          <p className="filterLabel">Quantity (MWh)</p>
          <div className="filterRange">
            <div className="filterRangeControl">
              <p className="filterRangeValue">Min {formatNumber(quantityMinValue)}</p>
              <input
                className="filterSlider"
                type="range"
                min={QUANTITY_RANGE.min}
                max={QUANTITY_RANGE.max}
                step={QUANTITY_RANGE.step}
                value={quantityMinValue}
                onChange={handleQuantityMinChange}
                aria-label="Minimum quantity in MWh"
              />
            </div>
            <span className="filterRangeSeparator">to</span>
            <div className="filterRangeControl">
              <p className="filterRangeValue">Max {formatNumber(quantityMaxValue)}</p>
              <input
                className="filterSlider"
                type="range"
                min={QUANTITY_RANGE.min}
                max={QUANTITY_RANGE.max}
                step={QUANTITY_RANGE.step}
                value={quantityMaxValue}
                onChange={handleQuantityMaxChange}
                aria-label="Maximum quantity in MWh"
              />
            </div>
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
