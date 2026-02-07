from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, Field, model_validator


class EnergyType(str, Enum):
    solar = "Solar"
    wind = "Wind"
    natural_gas = "Natural Gas"
    nuclear = "Nuclear"
    coal = "Coal"
    hydro = "Hydro"


class ContractStatus(str, Enum):
    available = "Available"
    reserved = "Reserved"
    sold = "Sold"


class ContractBase(BaseModel):
    energy_type: EnergyType
    quantity_mwh: Decimal = Field(gt=0, max_digits=18, decimal_places=3)
    price_per_mwh: Decimal = Field(gt=0, max_digits=18, decimal_places=6)
    delivery_start: date
    delivery_end: date
    location: str = Field(min_length=2, max_length=80)
    status: ContractStatus = ContractStatus.available

    @model_validator(mode="after")
    def validate_delivery_dates(self) -> "ContractBase":
        if self.delivery_end < self.delivery_start:
            raise ValueError("delivery_end must be on or after delivery_start")
        return self


class ContractCreate(ContractBase):
    pass


class ContractUpdate(BaseModel):
    energy_type: EnergyType | None = None
    quantity_mwh: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=18,
        decimal_places=3,
    )
    price_per_mwh: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=18,
        decimal_places=6,
    )
    delivery_start: date | None = None
    delivery_end: date | None = None
    location: str | None = Field(default=None, min_length=2, max_length=80)
    status: ContractStatus | None = None

    @model_validator(mode="after")
    def validate_delivery_dates(self) -> "ContractUpdate":
        if self.delivery_start is None or self.delivery_end is None:
            return self
        if self.delivery_end < self.delivery_start:
            raise ValueError("delivery_end must be on or after delivery_start")
        return self


class ContractFilters(BaseModel):
    energy_types: list[EnergyType] | None = None
    price_min: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=6)
    price_max: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=6)
    quantity_min: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=3)
    quantity_max: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=3)
    location: str | None = Field(default=None, min_length=2, max_length=80)
    delivery_start_from: date | None = None
    delivery_end_to: date | None = None
    # Optional status filter for list/search queries
    status: ContractStatus | None = None
    search: str | None = Field(default=None, min_length=2, max_length=120)

    @model_validator(mode="after")
    def validate_ranges(self) -> "ContractFilters":
        if self.price_min is not None and self.price_max is not None and self.price_min > self.price_max:
            raise ValueError("price_min must be less than or equal to price_max")
        if (
            self.quantity_min is not None
            and self.quantity_max is not None
            and self.quantity_min > self.quantity_max
        ):
            raise ValueError("quantity_min must be less than or equal to quantity_max")
        if (
            self.delivery_start_from is not None
            and self.delivery_end_to is not None
            and self.delivery_start_from > self.delivery_end_to
        ):
            raise ValueError("delivery_start_from must be on or before delivery_end_to")
        return self


class ContractRead(ContractBase):
    id: int
    model_config = {"from_attributes": True}


class ComparisonRangeDecimal(BaseModel):
    min: Decimal
    max: Decimal
    spread: Decimal


class ComparisonRangeInt(BaseModel):
    min: int
    max: int
    spread: int


class ContractComparisonItem(ContractRead):
    duration_days: int


class ContractComparisonMetrics(BaseModel):
    price_per_mwh: ComparisonRangeDecimal
    quantity_mwh: ComparisonRangeDecimal
    duration_days: ComparisonRangeInt


class ContractComparisonResponse(BaseModel):
    contracts: list[ContractComparisonItem]
    metrics: ContractComparisonMetrics


class PortfolioHoldingRead(BaseModel):
    id: int
    added_at: datetime
    contract: ContractRead
    model_config = {"from_attributes": True}


class PortfolioRead(BaseModel):
    user_id: int
    holdings: list[PortfolioHoldingRead]


class PortfolioEnergyBreakdown(BaseModel):
    energy_type: EnergyType
    total_contracts: int
    total_capacity_mwh: Decimal
    total_cost: Decimal
    weighted_avg_price_per_mwh: Decimal


class PortfolioMetrics(BaseModel):
    total_contracts: int
    total_capacity_mwh: Decimal
    total_cost: Decimal
    weighted_avg_price_per_mwh: Decimal
    breakdown_by_energy_type: list[PortfolioEnergyBreakdown]
