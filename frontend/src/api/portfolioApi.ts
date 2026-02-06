import { getApiBaseUrl } from "./client";
import type {
  PortfolioHolding,
  PortfolioMetrics,
  PortfolioRead,
} from "../types/contracts";

const getJson = async <T>(response: Response, fallbackMessage: string): Promise<T> => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || fallbackMessage);
  }
  return (await response.json()) as T;
};

export const fetchPortfolio = async (userId: number): Promise<PortfolioRead> => {
  const response = await fetch(`${getApiBaseUrl()}/portfolios/${userId}`, {
    headers: {
      Accept: "application/json",
    },
  });
  return getJson<PortfolioRead>(response, "Unable to load portfolio.");
};

export const fetchPortfolioMetrics = async (userId: number): Promise<PortfolioMetrics> => {
  const response = await fetch(`${getApiBaseUrl()}/portfolios/${userId}/metrics`, {
    headers: {
      Accept: "application/json",
    },
  });
  return getJson<PortfolioMetrics>(response, "Unable to load portfolio metrics.");
};

export const addContractToPortfolio = async (
  userId: number,
  contractId: number,
): Promise<PortfolioHolding> => {
  const response = await fetch(
    `${getApiBaseUrl()}/portfolios/${userId}/contracts/${contractId}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    },
  );
  return getJson<PortfolioHolding>(response, "Unable to add contract to portfolio.");
};

export const removeContractFromPortfolio = async (
  userId: number,
  contractId: number,
): Promise<void> => {
  const response = await fetch(
    `${getApiBaseUrl()}/portfolios/${userId}/contracts/${contractId}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    },
  );
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Unable to remove contract from portfolio.");
  }
};
