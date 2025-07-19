import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:adm1n#Mobi@localhost:5433/trackm")

engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    future=True,
    pool_size=20,        # Increased pool size
    max_overflow=20,     # Allow more overflow connections
    pool_timeout=30      # Wait up to 30 seconds for a connection
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as db:
        yield db 