from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    # Deliberately no Field(min_length=...) here: password strength is a *business rule*
    # (WEAK_PASSWORD, 400, AuthError body — src/auth/validation.py), not a schema
    # constraint. Enforcing the length at this layer would make FastAPI return its default
    # 422 validation-error shape instead, which the OpenAPI contract doesn't define.
    password: str = Field(min_length=1)
    display_name: str | None = None


class SigninRequest(BaseModel):
    email: EmailStr
    password: str


AuthErrorCode = Literal[
    "EMAIL_ALREADY_REGISTERED",
    "WEAK_PASSWORD",
    "INVALID_CREDENTIALS",
    "TOO_MANY_ATTEMPTS",
    "SESSION_EXPIRED",
]


class AuthError(BaseModel):
    error: AuthErrorCode
    message: str
