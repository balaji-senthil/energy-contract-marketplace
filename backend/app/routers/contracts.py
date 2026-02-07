from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import conint
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.schemas import (
    ComparisonRangeDecimal,
    ComparisonRangeInt,
    ContractCreate,
    ContractComparisonItem,
    ContractComparisonMetrics,
    ContractComparisonResponse,
    ContractFilters,
    ContractRead,
    ContractSortBy,
    ContractSortDirection,
    ContractStatus,
    ContractUpdate,
    EnergyType,
)
from app.services.contracts_service import (
    create_contract,
    delete_contract,
    get_contract_by_id,
    list_contracts_by_ids,
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
    sort_by: ContractSortBy | None = Query(default=None),
    sort_direction: ContractSortDirection | None = Query(default=None),
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
        sort_by=sort_by,
        sort_direction=sort_direction,
    )


def build_decimal_range(values: list[Decimal]) -> ComparisonRangeDecimal:
    min_value = min(values)
    max_value = max(values)
    return ComparisonRangeDecimal(min=min_value, max=max_value, spread=max_value - min_value)


def build_int_range(values: list[int]) -> ComparisonRangeInt:
    min_value = min(values)
    max_value = max(values)
    return ComparisonRangeInt(min=min_value, max=max_value, spread=max_value - min_value)


def calculate_duration_days(delivery_start: date, delivery_end: date) -> int:
    return (delivery_end - delivery_start).days + 1


@router.get("/compare", response_model=ContractComparisonResponse)
async def compare_contracts(
    ids: list[conint(ge=1)] = Query(..., min_length=2, max_length=3),
    session: AsyncSession = Depends(get_session),
) -> ContractComparisonResponse:
    if len(set(ids)) != len(ids):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Contract ids must be unique")

    contracts = await list_contracts_by_ids(session=session, contract_ids=ids)
    contract_by_id = {contract.id: contract for contract in contracts}
    missing_ids = [contract_id for contract_id in ids if contract_id not in contract_by_id]
    if missing_ids:
        missing_str = ", ".join(str(contract_id) for contract_id in missing_ids)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contracts not found: {missing_str}",
        )

    comparison_items: list[ContractComparisonItem] = []
    for contract_id in ids:
        contract = contract_by_id[contract_id]
        contract_read = ContractRead.model_validate(contract)
        comparison_items.append(
            ContractComparisonItem(
                **contract_read.model_dump(),
                duration_days=calculate_duration_days(
                    delivery_start=contract.delivery_start,
                    delivery_end=contract.delivery_end,
                ),
            )
        )

    price_values = [contract.price_per_mwh for contract in comparison_items]
    quantity_values = [contract.quantity_mwh for contract in comparison_items]
    duration_values = [contract.duration_days for contract in comparison_items]

    metrics = ContractComparisonMetrics(
        price_per_mwh=build_decimal_range(price_values),
        quantity_mwh=build_decimal_range(quantity_values),
        duration_days=build_int_range(duration_values),
    )
    return ContractComparisonResponse(contracts=comparison_items, metrics=metrics)


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
