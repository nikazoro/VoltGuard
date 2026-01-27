from pydantic import BaseModel, Field
from typing import Optional


class ProfileRead(BaseModel):
    id: int
    email: str
    role: str

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    # future-update
    pass
