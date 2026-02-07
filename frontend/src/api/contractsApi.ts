import { getApiBaseUrl } from "./client";
import type {
  Contract,
  ContractApiFilters,
  ContractComparisonResponse,
} from "../types/contracts";

interface FetchContractsOptions {
  filters?: ContractApiFilters;
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
}

const appendNumberParam = (params: URLSearchParams, key: string, value: number | undefined) => {
  if (value === undefined || Number.isNaN(value)) {
    return;
  }
  params.set(key, String(value));
};

export const fetchContracts = async ({
  filters,
  offset = 0,
  limit = 50,
  signal,
}: FetchContractsOptions = {}): Promise<Contract[]> => {
  const params = new URLSearchParams();
  params.set("offset", String(offset));
  params.set("limit", String(limit));

  if (filters?.energy_types?.length) {
    filters.energy_types.forEach((energyType) => {
      params.append("energy_types", energyType);
    });
  }
  if (filters?.status) {
    params.set("status", filters.status);
  }
  appendNumberParam(params, "price_min", filters?.price_min);
  appendNumberParam(params, "price_max", filters?.price_max);
  appendNumberParam(params, "quantity_min", filters?.quantity_min);
  appendNumberParam(params, "quantity_max", filters?.quantity_max);
  if (filters?.location) {
    params.set("location", filters.location);
  }
  if (filters?.delivery_start_from) {
    params.set("delivery_start_from", filters.delivery_start_from);
  }
  if (filters?.delivery_end_to) {
    params.set("delivery_end_to", filters.delivery_end_to);
  }

  const response = await fetch(`${getApiBaseUrl()}/contracts?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Unable to load contracts.");
  }

  return (await response.json()) as Contract[];
};

interface FetchContractComparisonOptions {
  ids: number[];
  signal?: AbortSignal;
}

export const fetchContractComparison = async ({
  ids,
  signal,
}: FetchContractComparisonOptions): Promise<ContractComparisonResponse> => {
  const params = new URLSearchParams();
  ids.forEach((id) => {
    params.append("ids", String(id));
  });

  const response = await fetch(`${getApiBaseUrl()}/contracts/compare?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Unable to compare contracts.");
  }

  return (await response.json()) as ContractComparisonResponse;
};
