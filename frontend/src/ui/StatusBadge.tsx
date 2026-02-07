import type { ContractStatus } from "../types/contracts";

interface StatusBadgeProps {
  status: ContractStatus;
}

const statusCssClassMap: Record<ContractStatus, string> = {
  Available: "statusBadge statusBadgeAvailable",
  Reserved: "statusBadge statusBadgeReserved",
  Sold: "statusBadge statusBadgeSold",
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  return <span className={statusCssClassMap[status]}>{status}</span>;
};

export default StatusBadge;
