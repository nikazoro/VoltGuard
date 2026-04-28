from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ....db.session import get_db_session
from ....api.dependencies.auth import get_current_user
from ....models.models import User
from ....schemas.profile import ProfileRead, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("/", response_model=ProfileRead)
async def get_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.patch("/")
async def update_profile(
    payload: ProfileUpdate,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """
    Profile update placeholder.
    Intentionally minimal.
    Prevents frontend breaking when fields are added later.
    """
    # Nothing to update yet
    return {"status": "profile up to date"}
