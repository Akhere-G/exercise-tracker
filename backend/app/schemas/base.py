from datetime import UTC, datetime
from typing import Annotated, Any

from pydantic import AfterValidator, ConfigDict, PlainSerializer, field_validator
from pydantic import BaseModel as Base
from pydantic.alias_generators import to_camel


class BaseModel(Base):
    """
    A base model that automatically translates between
    Python snake_case and JSON camelCase.
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


def to_naive_utc(value: datetime) -> datetime:
    """The moment in UTC without a tzinfo, which is how the database stores it."""
    if value.tzinfo is None:
        return value
    return value.astimezone(UTC).replace(tzinfo=None)


def to_aware_utc(value: datetime) -> datetime:
    """Stored times are naive UTC, so mark them as UTC when they leave the API."""
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


# Read as UTC whatever offset the client sent, and written out with a "Z" so the
# browser does not mistake a stored UTC time for a local one.
UtcDatetime = Annotated[
    datetime,
    AfterValidator(to_naive_utc),
    PlainSerializer(to_aware_utc, when_used="json"),
]


def _reject_null(value: Any) -> Any:
    if value is None:
        raise ValueError("This field cannot be null. Leave it out to keep it.")
    return value


def not_nullable(*field_names: str):
    """Reject an explicit null for update fields whose column cannot be NULL.

    Update schemas default every field to None to mean "not sent". Without this,
    sending null would try to write NULL to a NOT NULL column and return a 500.
    """
    return field_validator(*field_names)(_reject_null)
