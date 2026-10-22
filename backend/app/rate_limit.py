import os
import threading
import time
from collections import deque
from math import ceil

from fastapi import HTTPException, Request, status

_MAX_TRACKED_KEYS = 10_000


class SlidingWindowCounter:
    """In-memory count of events per key over a sliding time window.

    State is per process, so with several instances the effective limit is
    higher; put an edge rule (Cloud Armor, API gateway) in front for a hard cap.
    """

    def __init__(self, limit: int, window_secs: int, clock=time.monotonic):
        self.limit = limit
        self.window_secs = window_secs
        self._clock = clock
        self._events: dict[str, deque[float]] = {}
        self._lock = threading.Lock()
        _registry.append(self)

    def _prune(self, key: str, now: float) -> deque[float]:
        events = self._events.get(key)
        if events is None:
            return deque()
        while events and events[0] <= now - self.window_secs:
            events.popleft()
        if not events:
            del self._events[key]
            return deque()
        return events

    def is_limited(self, key: str) -> bool:
        with self._lock:
            return len(self._prune(key, self._clock())) >= self.limit

    def retry_after(self, key: str) -> int:
        """Seconds until the oldest event leaves the window (at least 1)."""
        with self._lock:
            now = self._clock()
            events = self._prune(key, now)
            if not events:
                return 1
            return max(1, ceil(events[0] + self.window_secs - now))

    def record(self, key: str) -> None:
        with self._lock:
            now = self._clock()
            if len(self._events) >= _MAX_TRACKED_KEYS and key not in self._events:
                self._drop_expired(now)
            self._events.setdefault(key, deque()).append(now)

    def reset(self, key: str) -> None:
        with self._lock:
            self._events.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._events.clear()

    def _drop_expired(self, now: float) -> None:
        for key in list(self._events):
            self._prune(key, now)
        if len(self._events) >= _MAX_TRACKED_KEYS:
            # Still full of live keys: forget the oldest rather than grow.
            oldest = min(self._events, key=lambda k: self._events[k][-1])
            del self._events[oldest]


_registry: list[SlidingWindowCounter] = []


def reset_all_limits() -> None:
    for counter in _registry:
        counter.clear()


# Registrations and demo logins count every attempt; login counts failures so
# normal use is never throttled.
REGISTER_BY_IP = SlidingWindowCounter(limit=5, window_secs=60 * 60)
DEMO_BY_IP = SlidingWindowCounter(limit=30, window_secs=60)
LOGIN_FAILURES_BY_IP_AND_EMAIL = SlidingWindowCounter(limit=5, window_secs=15 * 60)
LOGIN_FAILURES_BY_IP = SlidingWindowCounter(limit=20, window_secs=15 * 60)


def trusted_proxy_count() -> int | None:
    """Number of proxies in front of the app that append to X-Forwarded-For.

    None (env var unset) means we cannot tell real client addresses apart, so
    limits keyed on the IP alone are disabled: behind the Next.js server every
    user would share one address and the limit would hit the whole site.
    """
    raw = os.getenv("TRUSTED_PROXY_COUNT")
    return int(raw) if raw not in (None, "") else None


def ip_limits_enabled() -> bool:
    return trusted_proxy_count() is not None


def client_ip(request: Request) -> str:
    """The caller's IP, honouring X-Forwarded-For from our own proxies only.

    With TRUSTED_PROXY_COUNT=n the entry n places from the right is the
    address the nearest trusted proxy saw; anything to its left is
    client-supplied and ignored, so it cannot be spoofed. Without it only the
    socket address is used.
    """
    trusted = trusted_proxy_count()
    forwarded = request.headers.get("x-forwarded-for")
    if trusted and forwarded:
        hops = [hop.strip() for hop in forwarded.split(",") if hop.strip()]
        if len(hops) >= trusted:
            return hops[-trusted]
    return request.client.host if request.client else "unknown"


def too_many_requests(retry_after: int, detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail=detail,
        headers={"Retry-After": str(retry_after)},
    )


def hit_ip_limit(counter: SlidingWindowCounter, request: Request, detail: str) -> None:
    """Count one attempt from this IP, or raise 429 if it is at its limit.

    Does nothing unless TRUSTED_PROXY_COUNT is configured (see above).
    """
    if not ip_limits_enabled():
        return
    key = client_ip(request)
    if counter.is_limited(key):
        raise too_many_requests(counter.retry_after(key), detail)
    counter.record(key)
