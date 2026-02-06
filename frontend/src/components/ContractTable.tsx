import type { Contract } from "../types/contracts";
import { formatCurrency, formatDateRange, formatNumber } from "../utils/format";
import StatusBadge from "./StatusBadge";

interface ContractTableProps {
  contracts: Contract[];
}

const ContractTable = ({ contracts }: ContractTableProps) => {
  return (
    <div className="tableWrapper">
      <table className="contractsTable">
        <thead>
          <tr>
            <th>Contract</th>
            <th>Energy Type</th>
            <th>Quantity (MWh)</th>
            <th>Price / MWh</th>
            <th>Delivery Window</th>
            <th>Location</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => (
            <tr key={contract.id}>
              <td>#{contract.id}</td>
              <td>{contract.energy_type}</td>
              <td>{formatNumber(contract.quantity_mwh)}</td>
              <td>{formatCurrency(contract.price_per_mwh)}</td>
              <td>{formatDateRange(contract.delivery_start, contract.delivery_end)}</td>
              <td>{contract.location}</td>
              <td>
                <StatusBadge status={contract.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContractTable;
