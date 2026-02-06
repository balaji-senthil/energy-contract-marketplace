const DEFAULT_API_URL = "http://localhost:8000";

export const getApiBaseUrl = (): string => {
  const configured = import.meta.env.VITE_API_URL;
  if (typeof configured === "string" && configured.trim().length > 0) {
    return configured;
  }
  return DEFAULT_API_URL;
};
