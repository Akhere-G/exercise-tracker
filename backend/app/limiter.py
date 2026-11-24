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


def find_rate_limit_warnings(
    trusted_proxy_count: int | None, redis_url: str | None
) -> list[str]:
    """What is wrong or weak about the rate-limit setup, for the startup log.

    Without a trusted proxy count the limiter cannot tell clients apart behind a
    proxy (they would all share one limit), so it stays off until it is set.
    """
    if trusted_proxy_count is None:
        return [
            "Rate limiting is OFF: login, register and AI requests are not "
            "throttled. Set TRUSTED_PROXY_COUNT to the number of proxies in front "
            "of the API (0 if clients connect directly) to turn it on."
        ]
    warnings = []
    if not redis_url:
        warnings.append(
            "REDIS_URL is not set, so rate limits are counted per instance, not "
            "across all of them."
        )
    return warnings


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        {"detail": "Too many requests. Try again later."},
        status_code=429,
        headers={"Retry-After": str(exc.limit.limit.get_expiry())},
    )
