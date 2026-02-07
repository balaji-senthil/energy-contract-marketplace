import type { ChangeEvent } from "react";
import type {
  ContractFilterState,
  ContractSortState,
  ContractSortBy,
  ContractSortDirection,
  ContractStatus,
  EnergyType,
} from "../types/contracts";
import { PRICE_RANGE, QUANTITY_RANGE } from "../constants/filters";
import { formatCurrency, formatNumber } from "../utils/format";
import FilterIcon from "../ui/FilterIcon";
import SortIcon from "../ui/SortIcon";

interface ContractFiltersProps {
  filters: ContractFilterState;
  sortState: ContractSortState;
  hasActiveSort: boolean;
  activeFilterCount: number;
  isFiltering: boolean;
  isSorting: boolean;
  matchingCount: number | null;
  onFiltersChange: (next: ContractFilterState) => void;
  onSortChange: (next: ContractSortState) => void;
  onReset: () => void;
}

const energyTypes: EnergyType[] = ["Solar", "Wind", "Natural Gas", "Nuclear", "Coal", "Hydro"];
const statusOptions: Array<ContractStatus | "Any"> = ["Any", "Available", "Reserved", "Sold"];
const sortOptions: Array<{ value: ContractSortBy | "None"; label: string }> = [
  { value: "None", label: "None" },
  { value: "price_per_mwh", label: "Price per MWh" },
  { value: "quantity_mwh", label: "Quantity (MWh)" },
  { value: "delivery_start", label: "Delivery start date" },
];
const sortDirectionOptions: Array<{ value: ContractSortDirection; label: string }> = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

const ContractFilters = ({
  filters,
  sortState,
  hasActiveSort,
  activeFilterCount,
  isFiltering,
  isSorting,
  matchingCount,
  onFiltersChange,
  onSortChange,
  onReset,
}: ContractFiltersProps) => {
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
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

  const handleDeliveryStartChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextStart = event.target.value;
    if (!nextStart) {
      onFiltersChange({ ...filters, deliveryStartFrom: "" });
      return;
    }

    const today = getTodayDateString();
    let nextEnd = filters.deliveryEndTo || today;
    if (nextStart > nextEnd) {
      nextEnd = nextStart;
    }

    onFiltersChange({
      ...filters,
      deliveryStartFrom: nextStart,
      deliveryEndTo: nextEnd,
    });
  };

  const handleDeliveryEndChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextEnd = event.target.value;
    if (!nextEnd) {
      onFiltersChange({ ...filters, deliveryEndTo: "" });
      return;
    }

    const today = getTodayDateString();
    let nextStart = filters.deliveryStartFrom || today;
    if (nextStart > nextEnd) {
      nextStart = nextEnd;
    }

    onFiltersChange({
      ...filters,
      deliveryStartFrom: nextStart,
      deliveryEndTo: nextEnd,
    });
  };

  const noFiltersApplied: boolean = activeFilterCount === 0;
  const noFiltersAndNoSort: boolean = noFiltersApplied && !hasActiveSort;
  const hasActiveFilters: boolean = !noFiltersApplied;
  const isWorking = isFiltering || isSorting;
  const shouldShowStatusIcons: boolean =
    !isWorking && (hasActiveFilters || hasActiveSort) && !noFiltersAndNoSort;
  const matchingLabel: string | null =
    noFiltersApplied || isWorking
      ? null
      : matchingCount === null
        ? null
        : matchingCount === 0
          ? "No matching results"
          : `Matching results: ${matchingCount}`;

  return (
    <div className="filtersCard">
      <div className="filtersHeader">
        <div>
          <p className="filtersEyebrow">Filter and Sort</p>
          <p className="filtersSubtitle">Refine by energy, price, delivery, and location.</p>
        </div>
        <div className="filtersActions">
          <div className={`filterStatus ${isWorking ? "filterStatusActive" : ""}`}>
            <p className="filtersMeta">
              {shouldShowStatusIcons && (
                <span className="filterStatusIcons" aria-hidden="true">
                  {(!isFiltering && hasActiveFilters) && <FilterIcon className="filterStatusIcon" />}
                  {(!isSorting && hasActiveSort) && <SortIcon className="filterStatusIcon" />}
                </span>
              )}
              {isWorking && (
                <span
                  className="filterStatusSpinner"
                  role="status"
                  aria-label="Updating results"
                />
              )}
            </p>
            {(!isWorking && !noFiltersAndNoSort && matchingLabel )&& <p className="filtersMeta">{matchingLabel}</p>}
          </div>
          <button
            disabled={noFiltersAndNoSort || isWorking}
            title={noFiltersAndNoSort ? "No filters/sort applied" : "Clear all filters/sort"}
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

        <div className="filterGroup">
          <p className="filterLabel">Sort by</p>
          <select
            className="filterSelect"
            value={sortState.sortBy}
            onChange={(event) =>
              onSortChange({
                ...sortState,
                sortBy: event.target.value as ContractSortBy | "None",
              })
            }
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filterGroup">
          <p className="filterLabel">Sort direction</p>
          <select
            className="filterSelect"
            value={sortState.sortDirection}
            onChange={(event) =>
              onSortChange({
                ...sortState,
                sortDirection: event.target.value as ContractSortDirection,
              })
            }
            disabled={sortState.sortBy === "None"}
          >
            {sortDirectionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
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
              onChange={handleDeliveryStartChange}
            />
            <span className="filterRangeSeparator">to</span>
            <input
              className="filterInput"
              type="date"
              value={filters.deliveryEndTo}
              onChange={handleDeliveryEndChange}
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
