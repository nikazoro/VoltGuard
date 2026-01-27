from jose import JWTError, jwt
from typing import Optional
from ..core.config import settings


def decode_ws_token(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

        sub = payload.get("sub")

        # Explicit validation — required for type safety AND security
        if sub is None:
            return None

        return int(sub)

    except (JWTError, ValueError, TypeError):
        return None
