from collections.abc import Sequence
from typing import Optional

from sqlalchemy import asc, desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Contract
from app.schemas import ContractCreate, ContractFilters, ContractSortBy, ContractSortDirection, ContractUpdate


async def list_contracts(
    *, session: AsyncSession, offset: int, limit: int, filters: ContractFilters
) -> Sequence[Contract]:
    statement = select(Contract)
    filter_conditions = []

    if filters.energy_types:
        filter_conditions.append(
            Contract.energy_type.in_([energy_type.value for energy_type in filters.energy_types])
        )
    if filters.status:
        filter_conditions.append(Contract.status == filters.status.value)
    if filters.price_min is not None:
        filter_conditions.append(Contract.price_per_mwh >= filters.price_min)
    if filters.price_max is not None:
        filter_conditions.append(Contract.price_per_mwh <= filters.price_max)
    if filters.quantity_min is not None:
        filter_conditions.append(Contract.quantity_mwh >= filters.quantity_min)
    if filters.quantity_max is not None:
        filter_conditions.append(Contract.quantity_mwh <= filters.quantity_max)
    if filters.location:
        filter_conditions.append(Contract.location.ilike(f"%{filters.location.strip()}%"))
    if filters.delivery_start_from is not None:
        filter_conditions.append(Contract.delivery_end >= filters.delivery_start_from)
    if filters.delivery_end_to is not None:
        filter_conditions.append(Contract.delivery_start <= filters.delivery_end_to)
    if filters.search:
        search_term = f"%{filters.search.strip()}%"
        filter_conditions.append(
            or_(
                Contract.location.ilike(search_term),
                Contract.energy_type.ilike(search_term),
                Contract.status.ilike(search_term),
            )
        )

    if filter_conditions:
        statement = statement.where(*filter_conditions)

    sort_column = Contract.id
    if filters.sort_by == ContractSortBy.price_per_mwh:
        sort_column = Contract.price_per_mwh
    elif filters.sort_by == ContractSortBy.quantity_mwh:
        sort_column = Contract.quantity_mwh
    elif filters.sort_by == ContractSortBy.delivery_start:
        sort_column = Contract.delivery_start

    sort_direction = filters.sort_direction or ContractSortDirection.asc
    order_clause = asc(sort_column) if sort_direction == ContractSortDirection.asc else desc(sort_column)

    statement = statement.order_by(order_clause, Contract.id).offset(offset).limit(limit)
    result = await session.execute(statement)
    return result.scalars().all()


async def list_contracts_by_ids(
    *, session: AsyncSession, contract_ids: Sequence[int]
) -> Sequence[Contract]:
    if not contract_ids:
        return []
    statement = select(Contract).where(Contract.id.in_(contract_ids))
    result = await session.execute(statement)
    return result.scalars().all()


async def get_contract_by_id(*, session: AsyncSession, contract_id: int) -> Optional[Contract]:
    statement = select(Contract).where(Contract.id == contract_id)
    result = await session.execute(statement)
    return result.scalar_one_or_none()


async def create_contract(*, session: AsyncSession, payload: ContractCreate) -> Contract:
    contract = Contract(**payload.model_dump())
    session.add(contract)
    await session.commit()
    await session.refresh(contract)
    return contract


async def update_contract(
    *, session: AsyncSession, contract: Contract, payload: ContractUpdate
) -> Contract:
    update_data = payload.model_dump(exclude_unset=True)
    for field_name, field_value in update_data.items():
        setattr(contract, field_name, field_value)
    await session.commit()
    await session.refresh(contract)
    return contract


async def delete_contract(*, session: AsyncSession, contract: Contract) -> None:
    await session.delete(contract)
    await session.commit()
