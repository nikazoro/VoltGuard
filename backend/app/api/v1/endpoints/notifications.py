from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from ....db.session import get_db_session
from ....api.dependencies.auth import get_current_user
from ....models.notification import Notification
from ....schemas.notification import NotificationRead

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=list[NotificationRead])
async def list_notifications(
    session: AsyncSession = Depends(get_db_session),
    current_user=Depends(get_current_user),
):
    result = await session.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )
    return result.scalars().all()


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int = Path(..., gt=0),
    session: AsyncSession = Depends(get_db_session),
    current_user=Depends(get_current_user),
):
    notification = await session.get(Notification, notification_id)

    if notification is None or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notification.is_read is False:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        await session.commit()

    return {
        "notification_id": notification.id,
        "status": "read",
    }
