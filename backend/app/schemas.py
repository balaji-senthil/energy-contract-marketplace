from datetime import date
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
    quantity_mwh: float = Field(gt=0)
    price_per_mwh: float = Field(gt=0)
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
    quantity_mwh: float | None = Field(default=None, gt=0)
    price_per_mwh: float | None = Field(default=None, gt=0)
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


class ContractRead(ContractBase):
    id: int
    model_config = {"from_attributes": True}
