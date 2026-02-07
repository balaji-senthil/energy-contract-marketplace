from __future__ import annotations

from collections.abc import AsyncGenerator, Awaitable, Callable
from datetime import date
from decimal import Decimal
import os

import pytest
from fastapi import FastAPI
import httpx
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_app.db"

from app.db import get_session
from app.models import Base, Contract
from app.routers.contracts import router as contracts_router
from app.routers.portfolios import router as portfolios_router


@pytest.fixture
async def session_maker(
    tmp_path,
) -> AsyncGenerator[async_sessionmaker[AsyncSession], None]:
    db_path = tmp_path / "test.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path.as_posix()}")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    yield session_factory

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def app(
    session_maker: async_sessionmaker[AsyncSession],
) -> FastAPI:
    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        async with session_maker() as session:
            yield session

    app_instance = FastAPI(title="Energy Contract Marketplace Test")
    app_instance.include_router(contracts_router)
    app_instance.include_router(portfolios_router)

    @app_instance.get("/health")
    async def health_check() -> dict:
        return {"status": "ok"}

    app_instance.dependency_overrides[get_session] = override_get_session
    return app_instance


@pytest.fixture
async def client(app: FastAPI) -> AsyncGenerator[httpx.AsyncClient, None]:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport, base_url="http://testserver"
    ) as test_client:
        yield test_client


@pytest.fixture
async def create_contract(
    session_maker: async_sessionmaker[AsyncSession],
) -> Callable[..., Awaitable[Contract]]:
    async def _create_contract(**overrides: object) -> Contract:
        contract = Contract(
            energy_type=overrides.get("energy_type", "Solar"),
            quantity_mwh=overrides.get("quantity_mwh", Decimal("100.000")),
            price_per_mwh=overrides.get("price_per_mwh", Decimal("50.000000")),
            delivery_start=overrides.get("delivery_start", date(2026, 1, 1)),
            delivery_end=overrides.get("delivery_end", date(2026, 1, 31)),
            location=overrides.get("location", "Texas"),
            status=overrides.get("status", "Available"),
        )
        async with session_maker() as session:
            session.add(contract)
            await session.commit()
            await session.refresh(contract)
        return contract

    return _create_contract
