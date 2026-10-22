from typing import Annotated

from pydantic import (
    BaseModel as Base,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
    field_validator,
)
import re
from .base import BaseModel


def normalize_email(value: str) -> str:
    return value.strip().lower()


# Matches the String(50) columns on User.
MAX_USERNAME_LENGTH = 50
MAX_EMAIL_LENGTH = 50


class UserBase(BaseModel):
    username: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True, min_length=1, max_length=MAX_USERNAME_LENGTH
        ),
    ]
    email: EmailStr = Field(description="Email is required")

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, value: str) -> str:
        email = normalize_email(value)
        if len(email) > MAX_EMAIL_LENGTH:
            raise ValueError(f"Must be {MAX_EMAIL_LENGTH} characters or fewer.")
        return email


class User(BaseModel):
    id: int
    model_config = ConfigDict(from_attributes=True)


class UserCreate(UserBase):
    password: str = Field(
        min_length=8, max_length=72, description="Must be 8 characters or more."
    )

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not re.search(r"\d", value):
            raise ValueError("Must contain at least one digit.")

        if not re.search(r"[a-z]", value):
            raise ValueError("Must contain at least one lowercase character.")

        if not re.search(r"[A-Z]", value):
            raise ValueError("Must contain at least one uppercase character.")

        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, value: str) -> str:
        return normalize_email(value)


class Token(Base):
    access_token: str
    token_type: str
