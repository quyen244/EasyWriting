import uuid

from pydantic import BaseModel


class Account(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str

    model_config = {"from_attributes": True}
