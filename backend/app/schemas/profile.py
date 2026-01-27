from pydantic import BaseModel, Field
from typing import Optional


class ProfileRead(BaseModel):
    id: int
    email: str
    role: str

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    # future-safe: add name, phone later
    # keep empty for now to avoid fake fields
    pass
