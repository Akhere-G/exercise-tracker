import os

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded


def trusted_proxy_count() -> int | None:
    raw = os.getenv("TRUSTED_PROXY_COUNT")
    return int(raw) if raw else None


def client_ip(request: Request) -> str:
    trusted = trusted_proxy_count()
    forwarded = request.headers.get("x-forwarded-for")
    if trusted and forwarded:
        hops = [hop.strip() for hop in forwarded.split(",") if hop.strip()]
        if len(hops) >= trusted:
            return hops[-trusted]
    return request.client.host if request.client else "unknown"


limiter = Limiter(
    key_func=client_ip,
    storage_uri=os.getenv("REDIS_URL") or "memory://",
    enabled=trusted_proxy_count() is not None,
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        {"detail": "Too many requests. Try again later."},
        status_code=429,
        headers={"Retry-After": str(exc.limit.limit.get_expiry())},
    )
