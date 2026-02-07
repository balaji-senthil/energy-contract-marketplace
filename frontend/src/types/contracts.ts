export type EnergyType =
  | "Solar"
  | "Wind"
  | "Natural Gas"
  | "Nuclear"
  | "Coal"
  | "Hydro";

export type ContractStatus = "Available" | "Reserved" | "Sold";

export type ContractSortBy = "price_per_mwh" | "quantity_mwh" | "delivery_start";

export type ContractSortDirection = "asc" | "desc";

export interface Contract {
  id: number;
  energy_type: EnergyType;
  quantity_mwh: number;
  price_per_mwh: number;
  delivery_start: string;
  delivery_end: string;
  location: string;
  status: ContractStatus;
}

export interface ContractComparisonItem extends Contract {
  duration_days: number;
}

export interface ComparisonRangeDecimal {
  min: number;
  max: number;
  spread: number;
}

export interface ComparisonRangeInt {
  min: number;
  max: number;
  spread: number;
}

export interface ContractComparisonMetrics {
  price_per_mwh: ComparisonRangeDecimal;
  quantity_mwh: ComparisonRangeDecimal;
  duration_days: ComparisonRangeInt;
}

export interface ContractComparisonResponse {
  contracts: ContractComparisonItem[];
  metrics: ContractComparisonMetrics;
}

export interface ContractApiFilters {
  energy_types?: EnergyType[];
  status?: ContractStatus;
  price_min?: number;
  price_max?: number;
  quantity_min?: number;
  quantity_max?: number;
  location?: string;
  delivery_start_from?: string;
  delivery_end_to?: string;
  sort_by?: ContractSortBy;
  sort_direction?: ContractSortDirection;
}

export interface ContractFilterState {
  energyTypes: EnergyType[];
  status: ContractStatus | "Any";
  priceMin: string;
  priceMax: string;
  quantityMin: string;
  quantityMax: string;
  location: string;
  deliveryStartFrom: string;
  deliveryEndTo: string;
}

export interface ContractSortState {
  sortBy: ContractSortBy | "None";
  sortDirection: ContractSortDirection;
}

export type NumericValue = number | string;

export interface PortfolioHolding {
  id: number;
  added_at: string;
  contract: Contract;
}

export interface PortfolioRead {
  user_id: number;
  holdings: PortfolioHolding[];
}

export interface PortfolioEnergyBreakdown {
  energy_type: EnergyType;
  total_contracts: number;
  total_capacity_mwh: NumericValue;
  total_cost: NumericValue;
  weighted_avg_price_per_mwh: NumericValue;
}

export interface PortfolioMetrics {
  total_contracts: number;
  total_capacity_mwh: NumericValue;
  total_cost: NumericValue;
  weighted_avg_price_per_mwh: NumericValue;
  breakdown_by_energy_type: PortfolioEnergyBreakdown[];
}
