from collections.abc import Sequence
import logging
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Contract, Portfolio, PortfolioHolding, User

logger = logging.getLogger(__name__)


async def ensure_user_portfolio(*, session: AsyncSession, user_id: int) -> Portfolio:
    user = await session.get(User, user_id)
    if user is None:
        user = User(id=user_id)
        session.add(user)
        await session.flush()
        logger.info(f"User portfolio created: {user_id = }")

    statement = select(Portfolio).where(Portfolio.user_id == user_id)
    result = await session.execute(statement)
    portfolio = result.scalar_one_or_none()
    if portfolio is not None:
        return portfolio

    portfolio = Portfolio(user_id=user_id)
    session.add(portfolio)
    try:
        await session.commit()
        await session.refresh(portfolio)
    except Exception:
        await session.rollback()
        logger.exception(f"Create portfolio failed: {user_id = }")
        raise
    logger.info(f"Portfolio created: {user_id = }, {portfolio.id = }")
    return portfolio


async def get_contract(*, session: AsyncSession, contract_id: int) -> Contract | None:
    statement = select(Contract).where(Contract.id == contract_id)
    result = await session.execute(statement)
    return result.scalar_one_or_none()


async def add_contract_to_portfolio(
    *, session: AsyncSession, user_id: int, contract_id: int
) -> PortfolioHolding:
    contract = await get_contract(session=session, contract_id=contract_id)
    if contract is None:
        raise ValueError("Contract not found")

    portfolio = await ensure_user_portfolio(session=session, user_id=user_id)

    statement = select(PortfolioHolding).where(
        PortfolioHolding.portfolio_id == portfolio.id,
        PortfolioHolding.contract_id == contract_id,
    )
    result = await session.execute(statement)
    existing_holding = result.scalar_one_or_none()
    if existing_holding is not None:
        return existing_holding

    holding = PortfolioHolding(portfolio_id=portfolio.id, contract_id=contract_id)
    session.add(holding)
    try:
        await session.commit()
        await session.refresh(holding)
    except Exception:
        await session.rollback()
        logger.exception(f"Add contract to portfolio failed: {user_id = }, {contract_id = }")
        raise
    logger.info(f"Contract added to portfolio: {user_id = }, {contract_id = }, {holding.id = }")
    return holding


async def remove_contract_from_portfolio(
    *, session: AsyncSession, user_id: int, contract_id: int
) -> bool:
    statement = (
        select(PortfolioHolding)
        .join(Portfolio)
        .where(
            Portfolio.user_id == user_id,
            PortfolioHolding.contract_id == contract_id,
        )
    )
    result = await session.execute(statement)
    holding = result.scalar_one_or_none()
    if holding is None:
        return False

    await session.delete(holding)
    try:
        await session.commit()
    except Exception:
        await session.rollback()
        logger.exception(f"Remove contract from portfolio failed: {user_id = }, {contract_id = }")
        raise
    logger.info(f"Contract removed from portfolio: {user_id = }, {contract_id = }")
    return True


async def list_portfolio_holdings(
    *, session: AsyncSession, user_id: int
) -> Sequence[PortfolioHolding]:
    statement = (
        select(PortfolioHolding)
        .join(Portfolio)
        .where(Portfolio.user_id == user_id)
        .options(selectinload(PortfolioHolding.contract))
        .order_by(PortfolioHolding.added_at.desc())
    )
    result = await session.execute(statement)
    return result.scalars().all()


async def get_portfolio_metrics(*, session: AsyncSession, user_id: int) -> dict:
    await ensure_user_portfolio(session=session, user_id=user_id)

    totals_statement = (
        select(
            func.count(Contract.id),
            func.coalesce(func.sum(Contract.quantity_mwh), 0),
            func.coalesce(func.sum(Contract.quantity_mwh * Contract.price_per_mwh), 0),
        )
        .select_from(PortfolioHolding)
        .join(Portfolio)
        .join(Contract)
        .where(Portfolio.user_id == user_id)
    )
    totals_result = await session.execute(totals_statement)
    total_contracts, total_capacity, total_cost = totals_result.one()

    total_capacity = Decimal(total_capacity or 0)
    total_cost = Decimal(total_cost or 0)
    weighted_avg_price = (
        total_cost / total_capacity if total_capacity > 0 else Decimal("0")
    )

    breakdown_statement = (
        select(
            Contract.energy_type,
            func.count(Contract.id),
            func.coalesce(func.sum(Contract.quantity_mwh), 0),
            func.coalesce(func.sum(Contract.quantity_mwh * Contract.price_per_mwh), 0),
        )
        .select_from(PortfolioHolding)
        .join(Portfolio)
        .join(Contract)
        .where(Portfolio.user_id == user_id)
        .group_by(Contract.energy_type)
        .order_by(Contract.energy_type)
    )
    breakdown_result = await session.execute(breakdown_statement)
    breakdown_items = []
    for energy_type, count, capacity, cost in breakdown_result.all():
        capacity_decimal = Decimal(capacity or 0)
        cost_decimal = Decimal(cost or 0)
        breakdown_items.append(
            {
                "energy_type": energy_type,
                "total_contracts": int(count),
                "total_capacity_mwh": capacity_decimal,
                "total_cost": cost_decimal,
                "weighted_avg_price_per_mwh": (
                    cost_decimal / capacity_decimal
                    if capacity_decimal > 0
                    else Decimal("0")
                ),
            }
        )

    return {
        "total_contracts": int(total_contracts or 0),
        "total_capacity_mwh": total_capacity,
        "total_cost": total_cost,
        "weighted_avg_price_per_mwh": weighted_avg_price,
        "breakdown_by_energy_type": breakdown_items,
    }
