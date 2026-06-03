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
