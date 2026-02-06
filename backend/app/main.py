from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import engine
from app.models import Base
from app.routers.contracts import router as contracts_router
from app.routers.portfolios import router as portfolios_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Ensure db tables exist at startup - so create if not exists.
    # create_all is synchronous DDL, so we run it via the async connection with run_sync.
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="Energy Contract Marketplace", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # TODO: add production frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contracts_router)
app.include_router(portfolios_router)


@app.get("/health")
async def health_check() -> dict:
    return {"status": "ok"}
