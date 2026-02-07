from collections.abc import AsyncGenerator
import logging
import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/energy_contracts",
)

logger = logging.getLogger(__name__)

engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        logger.debug("db.session.opened")
        try:
            yield session
        except Exception:
            logger.exception("db.session.error")
            raise
        finally:
            logger.debug("db.session.closed")
