import type { ContractStatus } from "../types/contracts";

interface StatusBadgeProps {
  status: ContractStatus;
}

// todo: add css classes
const statusCssClassMap: Record<ContractStatus, string> = {
  Available: "statusBadge statusBadgeAvailable",
  Reserved: "statusBadge statusBadgeReserved",
  Sold: "statusBadge statusBadgeSold",
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  return <span className={statusCssClassMap[status]}>{status}</span>;
};

export default StatusBadge;
