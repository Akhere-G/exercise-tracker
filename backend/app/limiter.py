from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded

from app.config import settings


def client_ip(request: Request) -> str:
    trusted = settings.trusted_proxy_count
    forwarded = request.headers.get("x-forwarded-for")
    if trusted and forwarded:
        hops = [hop.strip() for hop in forwarded.split(",") if hop.strip()]
        if len(hops) >= trusted:
            return hops[-trusted]
    return request.client.host if request.client else "unknown"


limiter = Limiter(
    key_func=client_ip,
    storage_uri=settings.redis_url or "memory://",
    enabled=settings.trusted_proxy_count is not None,
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        {"detail": "Too many requests. Try again later."},
        status_code=429,
        headers={"Retry-After": str(exc.limit.limit.get_expiry())},
    )
