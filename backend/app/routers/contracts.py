from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.schemas import (
    ContractCreate,
    ContractFilters,
    ContractRead,
    ContractStatus,
    ContractUpdate,
    EnergyType,
)
from app.services.contracts_service import (
    create_contract,
    delete_contract,
    get_contract_by_id,
    list_contracts,
    update_contract,
)

router = APIRouter(prefix="/contracts", tags=["contracts"])


def get_contract_filters(
    energy_types: list[EnergyType] | None = Query(default=None),
    price_min: float | None = Query(default=None, ge=0),
    price_max: float | None = Query(default=None, ge=0),
    quantity_min: float | None = Query(default=None, ge=0),
    quantity_max: float | None = Query(default=None, ge=0),
    location: str | None = Query(default=None, min_length=2, max_length=80),
    delivery_start_from: date | None = Query(default=None),
    delivery_end_to: date | None = Query(default=None),
    status: ContractStatus | None = Query(default=None),
    search: str | None = Query(default=None, min_length=2, max_length=120),
) -> ContractFilters:
    return ContractFilters(
        energy_types=energy_types,
        price_min=price_min,
        price_max=price_max,
        quantity_min=quantity_min,
        quantity_max=quantity_max,
        location=location,
        delivery_start_from=delivery_start_from,
        delivery_end_to=delivery_end_to,
        status=status,
        search=search,
    )


@router.get("", response_model=list[ContractRead])
async def get_contracts(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    filters: ContractFilters = Depends(get_contract_filters),
    session: AsyncSession = Depends(get_session),
) -> list[ContractRead]:
    return list(await list_contracts(session=session, offset=offset, limit=limit, filters=filters))


@router.get("/{contract_id}", response_model=ContractRead)
async def get_contract(contract_id: int, session: AsyncSession = Depends(get_session)) -> ContractRead:
    contract = await get_contract_by_id(session=session, contract_id=contract_id)
    if contract is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    return contract


@router.post("", response_model=ContractRead, status_code=status.HTTP_201_CREATED)
async def create_contract_route(
    payload: ContractCreate, session: AsyncSession = Depends(get_session)
) -> ContractRead:
    return await create_contract(session=session, payload=payload)


@router.patch("/{contract_id}", response_model=ContractRead)
async def update_contract_route(
    contract_id: int, payload: ContractUpdate, session: AsyncSession = Depends(get_session)
) -> ContractRead:
    contract = await get_contract_by_id(session=session, contract_id=contract_id)
    if contract is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    return await update_contract(session=session, contract=contract, payload=payload)


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contract_route(
    contract_id: int, session: AsyncSession = Depends(get_session)
) -> None:
    contract = await get_contract_by_id(session=session, contract_id=contract_id)
    if contract is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    await delete_contract(session=session, contract=contract)
