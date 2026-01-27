from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ....api.dependencies.auth import get_current_user
from ....models.models import User
from ....db.session import get_db_session
from ....models.models import User
from ....schemas.user import UserCreate, UserRead
from ....core.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.schemas.auth import LoginRequest


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserRead)
async def register_user(
    payload: UserCreate,
    session: AsyncSession = Depends(get_db_session),
):
    existing = await session.execute(
        select(User).where(User.email == payload.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )

    session.add(user)
    await session.commit()
    await session.refresh(user)

    return user


# @router.post("/login")
# async def login(
#     email: str,
#     password: str,
#     session: AsyncSession = Depends(get_db_session),
# ):
#     result = await session.execute(
#         select(User).where(User.email == email)
#     )
#     user = result.scalar_one_or_none()

#     if not user or not verify_password(password, user.hashed_password):
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid credentials",
#         )

#     token = create_access_token(subject=str(user.id))
#     return {"access_token": token, "token_type": "bearer"}

@router.post("/login")
async def login(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_db_session),
):
    result = await session.execute(
        select(User).where(User.email == payload.email)
    )
    user = result.scalar_one_or_none()

    if user is None or not verify_password(
        payload.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token(subject=str(user.id))

    return {
        "access_token": token,
        "token_type": "bearer",
    }
    
@router.post("/login/oauth")
async def oauth_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_db_session),
):
    result = await session.execute(
        select(User).where(User.email == form_data.username)
    )
    user = result.scalar_one_or_none()

    if user is None or not verify_password(
        form_data.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token(subject=str(user.id))

    return {
        "access_token": token,
        "token_type": "bearer",
    }

@router.get("/me")
async def auth_me(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
    }


@router.post("/logout")
async def logout():
    """
    Stateless logout.
    Frontend deletes access + refresh tokens.
    """
    return {"status": "logged_out"}
