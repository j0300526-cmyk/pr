# 사용자 관련 라우터
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from database import get_db
from models import User, DayMission
from schemas import UserResponse, UserUpdate, FriendResponse
from auth import get_current_user
from datetime import date, timedelta

router = APIRouter(prefix="/users", tags=["사용자"])

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """현재 사용자 정보 조회"""
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자 프로필 업데이트"""
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.profile_color is not None:
        current_user.profile_color = user_update.profile_color
    if user_update.bio is not None:
        current_user.bio = user_update.bio
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/random", response_model=list[FriendResponse])
async def get_random_users(
    limit: int = Query(3, ge=1, le=10),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """랜덤 사용자 목록 (초대용)"""
    users = (
        db.query(User)
        .filter(User.id != current_user.id)
        .order_by(func.random())
        .limit(limit)
        .all()
    )

    thirty_days_ago = date.today() - timedelta(days=30)
    results: list[FriendResponse] = []

    for user in users:
        active_days = (
            db.query(func.count(func.distinct(DayMission.date)))
            .filter(
                and_(
                    DayMission.user_id == user.id,
                    DayMission.date >= thirty_days_ago,
                    DayMission.completed == True,
                )
            )
            .scalar()
            or 0
        )

        results.append(
            FriendResponse(
                id=user.id,
                name=user.name,
                activeDays=active_days,
                profileColor=user.profile_color,
            )
        )

    return results

