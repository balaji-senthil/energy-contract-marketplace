export type EnergyType =
  | "Solar"
  | "Wind"
  | "Natural Gas"
  | "Nuclear"
  | "Coal"
  | "Hydro";

export type ContractStatus = "Available" | "Reserved" | "Sold";

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
