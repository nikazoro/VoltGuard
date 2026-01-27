from fastapi import Depends, HTTPException, status
from ..dependencies.auth import get_current_user
from ...models.models import User, UserRole


def require_role(*allowed_roles: UserRole):
    """
    Usage:
    Depends(require_role(UserRole.admin))
    Depends(require_role(UserRole.admin, UserRole.station_owner))
    """

    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return role_checker
