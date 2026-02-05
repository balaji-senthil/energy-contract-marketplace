from collections.abc import Sequence
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Contract
from app.schemas import ContractCreate, ContractUpdate


async def list_contracts(*, session: AsyncSession, offset: int, limit: int) -> Sequence[Contract]:
    statement = select(Contract).offset(offset).limit(limit).order_by(Contract.id)
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
