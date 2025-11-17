# 날짜별 미션 라우터
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database import get_db
from models import DayMission, CatalogMission, User
from schemas import DayMissionResponse, DayMissionCreate, DayMissionUpdate
from auth import get_current_user
from datetime import date, datetime
import json
import os

router = APIRouter(prefix="/days", tags=["날짜별 미션"])

@router.get("/{date_str}/missions", response_model=list[DayMissionResponse])
@router.get("/{date_str}", response_model=list[DayMissionResponse])  # 레거시 호환
async def get_day_missions(
    date_str: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """특정 날짜의 미션 목록 조회"""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)"
        )
    
    missions = db.query(DayMission).filter(
        and_(
            DayMission.user_id == current_user.id,
            DayMission.date == target_date
        )
    ).all()
    
    # 관계 로드 (mission 정보 포함)
    for mission in missions:
        _ = mission.mission  # 관계 로드
        # CatalogMission.submissions는 DB에 JSON 문자열로 저장될 수 있으므로 리스트로 변환
        if isinstance(mission.mission.submissions, str):
            try:
                mission.mission.submissions = json.loads(mission.mission.submissions)
            except Exception:
                mission.mission.submissions = [mission.mission.submissions]
        # 프론트 호환용 name 필드 (첫 번째 예시 또는 카테고리명)
        mission.mission.name = mission.sub_mission or (
            mission.mission.submissions[0]
            if isinstance(mission.mission.submissions, list) and mission.mission.submissions
            else mission.mission.category
        )
    
    return missions

@router.post("/{date_str}/missions", response_model=DayMissionResponse)
async def add_mission(
    date_str: str,
    mission_data: DayMissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """특정 날짜에 미션 추가"""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)"
        )
    
    # 오늘 날짜만 추가 가능
    today = date.today()
    if target_date != today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="오늘 날짜에만 미션을 추가할 수 있습니다"
        )
    
    # 미션 카탈로그 확인
    mission = db.query(CatalogMission).filter(
        CatalogMission.id == mission_data.mission_id
    ).first()
    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 미션입니다"
        )

    submission = (mission_data.submission or "").strip()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="소주제를 선택해주세요"
        )
    # 개발용 디버그 로그
    submissions_value = mission.submissions
    if isinstance(submissions_value, str):
        try:
            submissions_list = json.loads(submissions_value)
        except Exception:
            submissions_list = [submissions_value]
    elif isinstance(submissions_value, list):
        submissions_list = submissions_value
    else:
        submissions_list = []

    if submissions_list and submission not in submissions_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="선택한 소주제가 유효하지 않습니다"
        )

    if os.getenv("ENV") != "production":
        try:
            print(
                f"[DEBUG add_mission] user_id={current_user.id}, "
                f"mission_id={mission_data.mission_id}, submission={submission}"
            )
            existing_count = db.query(DayMission).filter(
                and_(
                    DayMission.user_id == current_user.id,
                    DayMission.date == target_date,
                    DayMission.sub_mission == submission
                )
            ).count()
            todays_count = db.query(DayMission).filter(
                and_(
                    DayMission.user_id == current_user.id,
                    DayMission.date == target_date
                )
            ).count()
            print(f"[DEBUG add_mission] existing_count={existing_count}, todays_count={todays_count}")
        except Exception:
            pass
    
    # 중복 확인
    existing = db.query(DayMission).filter(
        and_(
            DayMission.user_id == current_user.id,
            DayMission.date == target_date,
            DayMission.sub_mission == submission
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="해당 소주제가 이미 추가되었습니다"
        )

    # 사용자별 하루 미션 수 제한 (최대 3개)
    todays_count = db.query(DayMission).filter(
        and_(
            DayMission.user_id == current_user.id,
            DayMission.date == target_date
        )
    ).count()
    if todays_count >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="개인 미션은 사용자당 하루 최대 3개까지 추가할 수 있습니다"
        )
    
    # 미션 추가
    day_mission = DayMission(
        user_id=current_user.id,
        mission_id=mission_data.mission_id,
        date=target_date,
        sub_mission=submission,
        completed=False
    )
    db.add(day_mission)
    db.commit()
    db.refresh(day_mission)
    
    # 관계 로드
    _ = day_mission.mission
    if isinstance(day_mission.mission.submissions, str):
        try:
            day_mission.mission.submissions = json.loads(day_mission.mission.submissions)
        except Exception:
            day_mission.mission.submissions = [day_mission.mission.submissions]
    day_mission.mission.name = day_mission.sub_mission or (
        day_mission.mission.submissions[0]
        if isinstance(day_mission.mission.submissions, list) and day_mission.mission.submissions
        else day_mission.mission.category
    )
    
    return day_mission

@router.delete("/{date_str}/missions/{mission_id}")
async def delete_mission(
    date_str: str,
    mission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """특정 날짜의 미션 삭제"""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)"
        )
    
    day_mission = db.query(DayMission).filter(
        and_(
            DayMission.id == mission_id,
            DayMission.user_id == current_user.id,
            DayMission.date == target_date
        )
    ).first()
    
    if not day_mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 미션입니다"
        )
    
    db.delete(day_mission)
    db.commit()
    return {"message": "미션이 삭제되었습니다"}

@router.patch("/{date_str}/missions/{mission_id}/complete", response_model=DayMissionResponse)
async def toggle_complete(
    date_str: str,
    mission_id: int,
    update_data: DayMissionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """미션 완료 상태 토글"""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)"
        )
    
    day_mission = db.query(DayMission).filter(
        and_(
            DayMission.id == mission_id,
            DayMission.user_id == current_user.id,
            DayMission.date == target_date
        )
    ).first()
    
    if not day_mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 미션입니다"
        )
    
    day_mission.completed = update_data.completed
    db.commit()
    db.refresh(day_mission)
    
    # 관계 로드
    _ = day_mission.mission
    if isinstance(day_mission.mission.submissions, str):
        try:
            day_mission.mission.submissions = json.loads(day_mission.mission.submissions)
        except Exception:
            day_mission.mission.submissions = [day_mission.mission.submissions]
    day_mission.mission.name = day_mission.sub_mission or (
        day_mission.mission.submissions[0]
        if isinstance(day_mission.mission.submissions, list) and day_mission.mission.submissions
        else day_mission.mission.category
    )
    
    return day_mission

