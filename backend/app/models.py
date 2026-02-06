from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Integer, Numeric, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    energy_type: Mapped[str] = mapped_column(String(50), nullable=False)
    quantity_mwh: Mapped[Decimal] = mapped_column(Numeric(18, 3), nullable=False)
    price_per_mwh: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    delivery_start: Mapped[date] = mapped_column(Date, nullable=False)
    delivery_end: Mapped[date] = mapped_column(Date, nullable=False)
    location: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Available")
