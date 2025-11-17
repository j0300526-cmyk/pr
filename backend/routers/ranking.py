# 랭킹 라우터
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from database import get_db
from models import User, DayMission, GroupMissionCheck, GroupMember
from schemas import RankingUserResponse, MyRankResponse
from auth import get_current_user
from datetime import date, timedelta
from typing import List

router = APIRouter(prefix="/ranking", tags=["랭킹"])

def calculate_user_score(user_id: int, db: Session) -> int:
    """사용자 총점 계산"""
    # 개인 미션 점수 (하루 최대 3점)
    personal_score = 0
    day_missions = db.query(DayMission).filter(
        and_(
            DayMission.user_id == user_id,
            DayMission.completed == True
        )
    ).all()
    
    # 날짜별로 그룹화하여 하루 최대 3점 계산
    from collections import defaultdict
    missions_by_date = defaultdict(list)
    for mission in day_missions:
        missions_by_date[mission.date].append(mission)
    
    for date_missions in missions_by_date.values():
        personal_score += min(len(date_missions), 3)
    
    # 그룹 미션 점수 (하루 최대 2점 또는 보너스 4점)
    group_score = 0
    user_groups = db.query(GroupMember).filter(
        GroupMember.user_id == user_id
    ).all()
    
    checks_by_date = defaultdict(lambda: defaultdict(list))
    for group_member in user_groups:
        checks = db.query(GroupMissionCheck).filter(
            and_(
                GroupMissionCheck.group_mission_id == group_member.group_mission_id,
                GroupMissionCheck.completed == True
            )
        ).all()
        for check in checks:
            checks_by_date[check.date][group_member.group_mission_id].append(check.user_id)
    
    for date_checks in checks_by_date.values():
        for group_id, completed_users in date_checks.items():
            if user_id in completed_users:
                # 그룹원 수 확인
                group = db.query(GroupMember).filter(
                    GroupMember.group_mission_id == group_id
                ).all()
                if len(group) == 3 and len(completed_users) == 3:
                    group_score = max(group_score, 4)  # 보너스 4점
                else:
                    group_score = max(group_score, 2)  # 기본 2점
    
    return personal_score + group_score

def calculate_streak(user_id: int, db: Session) -> int:
    """연속 달성일 계산"""
    completed_dates = db.query(func.distinct(DayMission.date)).filter(
        and_(
            DayMission.user_id == user_id,
            DayMission.completed == True
        )
    ).order_by(DayMission.date.desc()).all()
    
    if not completed_dates:
        return 0
    
    completed_dates_set = {d[0] for d in completed_dates}
    today = date.today()
    streak = 0
    
    while True:
        check_date = today - timedelta(days=streak)
        if check_date in completed_dates_set:
            streak += 1
        else:
            break
    
    return streak

@router.get("/personal", response_model=List[RankingUserResponse])
async def get_personal_ranking(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """개인 랭킹 조회"""
    users = db.query(User).all()
    
    rankings = []
    for user in users:
        score = calculate_user_score(user.id, db)
        streak = calculate_streak(user.id, db)
        
        rankings.append(RankingUserResponse(
            id=user.id,
            name=user.name,
            score=score,
            streak=streak,
            profile_color=user.profile_color
        ))
    
    # 점수 순으로 정렬
    rankings.sort(key=lambda x: x.score, reverse=True)
    return rankings

@router.get("/group", response_model=List[dict])
async def get_group_ranking(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """그룹 랭킹 조회"""
    groups = db.query(GroupMission).all()
    
    rankings = []
    for group in groups:
        # 그룹 총점 계산
        total_score = 0
        for member in group.members:
            total_score += calculate_user_score(member.user_id, db)
        
        rankings.append({
            "id": group.id,
            "name": group.name,
            "total_score": total_score,
            "member_count": len(group.members),
            "color": group.color
        })
    
    # 총점 순으로 정렬
    rankings.sort(key=lambda x: x["total_score"], reverse=True)
    return rankings

@router.get("/my", response_model=MyRankResponse)
async def get_my_rank(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """내 순위 조회"""
    # 개인 랭킹에서 내 순위 찾기
    all_rankings = await get_personal_ranking(current_user, db)
    personal_rank = next(
        (i + 1 for i, user in enumerate(all_rankings) if user.id == current_user.id),
        0
    )
    
    # 그룹별 순위
    group_ranks = []
    user_groups = db.query(GroupMember).filter(
        GroupMember.user_id == current_user.id
    ).all()
    
    for group_member in user_groups:
        group_ranking = await get_group_ranking(current_user, db)
        group_rank = next(
            (i + 1 for i, g in enumerate(group_ranking) if g["id"] == group_member.group_mission_id),
            0
        )
        group_ranks.append({
            "group_id": group_member.group_mission_id,
            "rank": group_rank
        })
    
    return MyRankResponse(
        personal_rank=personal_rank,
        group_ranks=group_ranks
    )

