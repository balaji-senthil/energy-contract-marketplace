from decimal import Decimal

import pytest
from fastapi import HTTPException

import app.routers.portfolios as portfolios_router


@pytest.mark.asyncio
async def test_add_contract_to_portfolio(create_contract, client):
    contract = await create_contract()
    response = await client.post(f"/portfolios/10/contracts/{contract.id}")
    assert response.status_code == 201
    data = response.json()
    assert data["contract"]["id"] == contract.id
    assert data["contract"]["energy_type"] == "Solar"


@pytest.mark.asyncio
async def test_get_portfolio_returns_holdings(create_contract, client):
    contract = await create_contract(location="Utah")
    await client.post(f"/portfolios/12/contracts/{contract.id}")

    response = await client.get("/portfolios/12")
    assert response.status_code == 200
    payload = response.json()
    assert payload["user_id"] == 12
    assert len(payload["holdings"]) == 1
    assert payload["holdings"][0]["contract"]["id"] == contract.id


@pytest.mark.asyncio
async def test_remove_contract_from_portfolio(create_contract, client):
    contract = await create_contract()
    await client.post(f"/portfolios/3/contracts/{contract.id}")

    delete_response = await client.delete(f"/portfolios/3/contracts/{contract.id}")
    assert delete_response.status_code == 204

    missing_response = await client.delete(f"/portfolios/3/contracts/{contract.id}")
    assert missing_response.status_code == 404
    assert missing_response.json()["detail"] == "Portfolio holding not found"


@pytest.mark.asyncio
async def test_portfolio_metrics_after_add(create_contract, client):
    contract = await create_contract(
        quantity_mwh=Decimal("200.000"),
        price_per_mwh=Decimal("30.000000"),
        energy_type="Wind",
    )
    await client.post(f"/portfolios/20/contracts/{contract.id}")

    response = await client.get("/portfolios/20/metrics")
    assert response.status_code == 200
    metrics = response.json()
    assert metrics["total_contracts"] == 1
    assert Decimal(str(metrics["total_capacity_mwh"])) == Decimal("200.000")
    assert Decimal(str(metrics["total_cost"])) == Decimal("6000.000000")
    assert Decimal(str(metrics["weighted_avg_price_per_mwh"])) == Decimal("30.000000")
    assert metrics["breakdown_by_energy_type"][0]["energy_type"] == "Wind"


@pytest.mark.asyncio
async def test_add_contract_to_portfolio_missing_contract(client):
    response = await client.post("/portfolios/99/contracts/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Contract not found"


@pytest.mark.asyncio
async def test_add_contract_returns_holding_when_missing_in_lookup(
    create_contract, session_maker, monkeypatch
):
    contract = await create_contract()

    async def empty_holdings(*, session, user_id):
        return []

    monkeypatch.setattr(portfolios_router, "list_portfolio_holdings", empty_holdings)

    async with session_maker() as session:
        holding = await portfolios_router.add_contract(
            user_id=42, contract_id=contract.id, session=session
        )
    assert holding.contract_id == contract.id


@pytest.mark.asyncio
async def test_add_contract_direct_missing_contract(session_maker):
    async with session_maker() as session:
        with pytest.raises(HTTPException) as exc:
            await portfolios_router.add_contract(
                user_id=55, contract_id=99999, session=session
            )
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_remove_contract_direct_not_found(session_maker):
    async with session_maker() as session:
        with pytest.raises(HTTPException) as exc:
            await portfolios_router.remove_contract(
                user_id=77, contract_id=99999, session=session
            )
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_get_portfolio_direct_empty(session_maker):
    async with session_maker() as session:
        response = await portfolios_router.get_portfolio(
            user_id=88, session=session
        )
    assert response.user_id == 88
    assert response.holdings == []


@pytest.mark.asyncio
async def test_get_portfolio_metrics_direct_empty(session_maker):
    async with session_maker() as session:
        metrics = await portfolios_router.get_portfolio_metrics_route(
            user_id=99, session=session
        )
    assert metrics.total_contracts == 0
