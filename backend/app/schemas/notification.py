from urllib.parse import urlparse

from pydantic import Field, field_validator

from .base import BaseModel

# Browsers hand out push endpoints on their vendor's push service. The server
# POSTs to whatever endpoint is stored, so anything else is refused rather than
# letting a user point it at an internal address.
PUSH_SERVICE_HOST_SUFFIXES = (
    "fcm.googleapis.com",
    "push.services.mozilla.com",
    "push.apple.com",
    "notify.windows.com",
)
MAX_ENDPOINT_LENGTH = 500  # the column is String(500)
MAX_KEY_LENGTH = 256


class NotificationBase(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool


class SubscriptionKeys(BaseModel):
    p256dh: str = Field(min_length=1, max_length=MAX_KEY_LENGTH)
    auth: str = Field(min_length=1, max_length=MAX_KEY_LENGTH)


def is_push_service_url(endpoint: str) -> bool:
    parsed = urlparse(endpoint)
    if parsed.scheme != "https" or parsed.username or parsed.password:
        return False
    try:
        port = parsed.port
    except ValueError:
        return False
    if port not in (None, 443) or not parsed.hostname:
        return False
    host = parsed.hostname.lower()
    return any(
        host == suffix or host.endswith(f".{suffix}")
        for suffix in PUSH_SERVICE_HOST_SUFFIXES
    )


class SubscriptionCreate(BaseModel):
    endpoint: str = Field(min_length=1, max_length=MAX_ENDPOINT_LENGTH)
    keys: SubscriptionKeys

    @field_validator("endpoint")
    @classmethod
    def endpoint_must_be_a_push_service(cls, endpoint: str) -> str:
        if not is_push_service_url(endpoint):
            raise ValueError("Endpoint must be an https URL on a browser push service.")
        return endpoint
