from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.schemas import ContractCreate, ContractRead, ContractUpdate
from app.services.contracts_service import (
    create_contract,
    delete_contract,
    get_contract_by_id,
    list_contracts,
    update_contract,
)

router = APIRouter(prefix="/contracts", tags=["contracts"])


@router.get("", response_model=list[ContractRead])
async def get_contracts(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
) -> list[ContractRead]:
    return list(await list_contracts(session=session, offset=offset, limit=limit))


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
