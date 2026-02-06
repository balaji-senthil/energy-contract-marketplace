from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.schemas import PortfolioMetrics, PortfolioRead, PortfolioHoldingRead
from app.services.portfolios_service import (
    add_contract_to_portfolio,
    get_portfolio_metrics,
    list_portfolio_holdings,
    remove_contract_from_portfolio,
    ensure_user_portfolio,
)

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


@router.post(
    "/{user_id}/contracts/{contract_id}",
    response_model=PortfolioHoldingRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_contract(
    user_id: int,
    contract_id: int,
    session: AsyncSession = Depends(get_session),
) -> PortfolioHoldingRead:
    try:
        holding = await add_contract_to_portfolio(
            session=session, user_id=user_id, contract_id=contract_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    holding_with_contract = await list_portfolio_holdings(
        session=session, user_id=user_id
    )
    holding_match = next(
        (item for item in holding_with_contract if item.id == holding.id), None
    )
    if holding_match is None:
        return holding
    return holding_match


@router.delete(
    "/{user_id}/contracts/{contract_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_contract(
    user_id: int,
    contract_id: int,
    session: AsyncSession = Depends(get_session),
) -> None:
    removed = await remove_contract_from_portfolio(
        session=session, user_id=user_id, contract_id=contract_id
    )
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio holding not found"
        )


@router.get("/{user_id}", response_model=PortfolioRead)
async def get_portfolio(
    user_id: int, session: AsyncSession = Depends(get_session)
) -> PortfolioRead:
    portfolio = await ensure_user_portfolio(session=session, user_id=user_id)
    holdings = await list_portfolio_holdings(session=session, user_id=user_id)
    return PortfolioRead(user_id=portfolio.user_id, holdings=list(holdings))


@router.get("/{user_id}/metrics", response_model=PortfolioMetrics)
async def get_portfolio_metrics_route(
    user_id: int, session: AsyncSession = Depends(get_session)
) -> PortfolioMetrics:
    metrics = await get_portfolio_metrics(session=session, user_id=user_id)
    return PortfolioMetrics(**metrics)
