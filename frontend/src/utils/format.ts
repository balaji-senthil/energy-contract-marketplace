const toNumber = (value: number | string): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatCurrency = (value: number | string): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(toNumber(value));
};

export const formatNumber = (value: number | string): string => {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(toNumber(value));
};

export const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
};

export const formatDateRange = (start: string, end: string): string => {
  return `${formatDate(start)} - ${formatDate(end)}`;
};
