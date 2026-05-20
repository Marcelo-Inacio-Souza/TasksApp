import asyncio
import socket

from backend.app.db.session import AsyncSessionLocal
from sqlalchemy import text


async def main() -> None:
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("select 1"))
            print(f"db_ok={result.scalar_one()}")
    except socket.gaierror as exc:
        print(f"db_error=host_not_resolved ({exc})")
        print("hint=Use a Session Pooler connection string in DATABASE_URL if Direct fails.")
        raise SystemExit(1) from exc
    except Exception as exc:
        print(f"db_error={type(exc).__name__}: {exc}")
        raise SystemExit(1) from exc


if __name__ == "__main__":
    asyncio.run(main())
