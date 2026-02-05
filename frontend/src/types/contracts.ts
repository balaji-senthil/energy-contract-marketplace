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
