from pydantic import BaseModel as Base, ConfigDict
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


def reject_explicit_nulls(model: Base, *fields: str) -> None:
    """Fail when a PATCH sends null for a field whose column is NOT NULL.

    Omitting the field leaves it unchanged; sending null would otherwise reach
    the database and surface as a 500.
    """
    for field in fields:
        if field in model.model_fields_set and getattr(model, field) is None:
            raise ValueError(f"{field} cannot be null.")
