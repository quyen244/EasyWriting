from typing import Literal

from pydantic import BaseModel

from src.schemas.account import Account


class AuthResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int
    user: Account
