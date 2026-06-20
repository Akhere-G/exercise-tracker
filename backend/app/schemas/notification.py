from .base import BaseModel


class NotificationBase(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool


class SubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class SubscriptionCreate(BaseModel):
    endpoint: str
    keys: SubscriptionKeys
