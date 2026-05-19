import asyncio

from sqlalchemy import text

from backend.app.db.session import AsyncSessionLocal


async def main() -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("select 1"))
        print(f"db_ok={result.scalar_one()}")


if __name__ == "__main__":
    asyncio.run(main())
