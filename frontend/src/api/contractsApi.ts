import type { Contract } from "../types/contracts";

const DEFAULT_API_URL = "http://localhost:8000";

const getApiBaseUrl = (): string => {
  const configured = import.meta.env.VITE_API_URL;
  if (typeof configured === "string" && configured.trim().length > 0) {
    return configured;
  }
  return DEFAULT_API_URL;
};

export const fetchContracts = async (): Promise<Contract[]> => {
  const response = await fetch(`${getApiBaseUrl()}/contracts`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Unable to load contracts.");
  }

  return (await response.json()) as Contract[];
};
