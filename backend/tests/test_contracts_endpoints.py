from datetime import date
from decimal import Decimal

import pytest
from fastapi import HTTPException

import app.routers.contracts as contracts_router
from app.schemas import ContractUpdate


@pytest.mark.asyncio
async def test_health_endpoint(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_create_contract_and_fetch(client):
    payload = {
        "energy_type": "Solar",
        "quantity_mwh": "120.000",
        "price_per_mwh": "45.500000",
        "delivery_start": "2026-02-01",
        "delivery_end": "2026-02-28",
        "location": "Nevada",
        "status": "Available",
    }
    create_response = await client.post("/contracts", json=payload)
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["energy_type"] == payload["energy_type"]
    assert created["location"] == payload["location"]
    assert created["status"] == payload["status"]

    contract_id = created["id"]
    get_response = await client.get(f"/contracts/{contract_id}")
    assert get_response.status_code == 200
    fetched = get_response.json()
    assert fetched["id"] == contract_id
    assert fetched["energy_type"] == payload["energy_type"]


@pytest.mark.asyncio
async def test_list_contracts_includes_seeded(create_contract, client):
    contract = await create_contract(location="Arizona")
    response = await client.get("/contracts")
    assert response.status_code == 200
    contracts = response.json()
    assert any(item["id"] == contract.id for item in contracts)


@pytest.mark.asyncio
async def test_contract_not_found(client):
    response = await client.get("/contracts/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Contract not found"


@pytest.mark.asyncio
async def test_update_contract(create_contract, client):
    contract = await create_contract(status="Available")
    payload = {"status": "Reserved", "price_per_mwh": "75.250000"}
    response = await client.patch(f"/contracts/{contract.id}", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Reserved"
    assert Decimal(str(data["price_per_mwh"])) == Decimal("75.250000")


@pytest.mark.asyncio
async def test_delete_contract(create_contract, client):
    contract = await create_contract()
    response = await client.delete(f"/contracts/{contract.id}")
    assert response.status_code == 204
    get_response = await client.get(f"/contracts/{contract.id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_compare_contracts_returns_metrics(create_contract, client):
    first = await create_contract(
        price_per_mwh=Decimal("40.000000"),
        quantity_mwh=Decimal("90.000"),
        delivery_start=date(2026, 3, 1),
        delivery_end=date(2026, 3, 31),
    )
    second = await create_contract(
        price_per_mwh=Decimal("55.000000"),
        quantity_mwh=Decimal("110.000"),
        delivery_start=date(2026, 4, 1),
        delivery_end=date(2026, 4, 30),
        location="Colorado",
    )
    response = await client.get(f"/contracts/compare?ids={first.id}&ids={second.id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data["contracts"]) == 2
    assert data["metrics"]["price_per_mwh"]["min"] is not None
    assert data["metrics"]["quantity_mwh"]["max"] is not None


@pytest.mark.asyncio
async def test_compare_contracts_rejects_duplicates(create_contract, client):
    contract = await create_contract()
    response = await client.get(
        f"/contracts/compare?ids={contract.id}&ids={contract.id}"
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Contract ids must be unique"


@pytest.mark.asyncio
async def test_compare_contracts_missing_ids(create_contract, client):
    contract = await create_contract()
    missing_id = 99999
    response = await client.get(
        f"/contracts/compare?ids={contract.id}&ids={missing_id}"
    )
    assert response.status_code == 404
    assert response.json()["detail"] == f"Contracts not found: {missing_id}"


@pytest.mark.asyncio
async def test_update_contract_not_found(client):
    response = await client.patch(
        "/contracts/99999", json={"status": "Reserved"}
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Contract not found"


@pytest.mark.asyncio
async def test_delete_contract_not_found(client):
    response = await client.delete("/contracts/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Contract not found"


@pytest.mark.asyncio
async def test_compare_contracts_direct_returns_metrics(create_contract, session_maker):
    first = await create_contract(
        price_per_mwh=Decimal("42.000000"),
        quantity_mwh=Decimal("80.000"),
        delivery_start=date(2026, 5, 1),
        delivery_end=date(2026, 5, 31),
    )
    second = await create_contract(
        price_per_mwh=Decimal("58.000000"),
        quantity_mwh=Decimal("120.000"),
        delivery_start=date(2026, 6, 1),
        delivery_end=date(2026, 6, 30),
    )

    async with session_maker() as session:
        response = await contracts_router.compare_contracts(
            ids=[first.id, second.id], session=session
        )
    assert response.metrics.price_per_mwh.min == Decimal("42.000000")
    assert response.metrics.quantity_mwh.max == Decimal("120.000")


@pytest.mark.asyncio
async def test_compare_contracts_direct_missing_ids(create_contract, session_maker):
    contract = await create_contract()
    async with session_maker() as session:
        with pytest.raises(HTTPException) as exc:
            await contracts_router.compare_contracts(
                ids=[contract.id, 99999], session=session
            )
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_get_contract_direct_not_found(session_maker):
    async with session_maker() as session:
        with pytest.raises(HTTPException) as exc:
            await contracts_router.get_contract(contract_id=99999, session=session)
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_update_contract_direct_not_found(session_maker):
    async with session_maker() as session:
        with pytest.raises(HTTPException) as exc:
            await contracts_router.update_contract_route(
                contract_id=99999,
                payload=ContractUpdate(status="Reserved"),
                session=session,
            )
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_contract_direct_not_found(session_maker):
    async with session_maker() as session:
        with pytest.raises(HTTPException) as exc:
            await contracts_router.delete_contract_route(
                contract_id=99999, session=session
            )
    assert exc.value.status_code == 404
