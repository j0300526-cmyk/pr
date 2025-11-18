# 날짜별 미션 라우터
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database import get_db
from models import DayMission, CatalogMission, User, WeeklyPersonalRoutine
from schemas import (
    DayMissionResponse,
    DayMissionCreate,
    DayMissionUpdate,
    CatalogMissionResponse,
    DayMissionBatchCreateResponse,
    DayCompletionSummary,
)
from auth import get_current_user
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo
import json
import os
from typing import List, Optional

# KST(Asia/Seoul) 타임존 설정
KST = ZoneInfo("Asia/Seoul")

def get_monday_of_week(target_date: date) -> date:
    """특정 날짜가 속한 주의 월요일 날짜를 반환"""
    days_since_monday = target_date.weekday()  # 0=월요일, 6=일요일
    monday = target_date - timedelta(days=days_since_monday)
    return monday

def get_sunday_of_week(target_date: date) -> date:
    """특정 날짜가 속한 주의 일요일 날짜를 반환"""
    days_until_sunday = 6 - target_date.weekday()  # 0=월요일(6일 후), 6=일요일(0일 후)
    sunday = target_date + timedelta(days=days_until_sunday)
    return sunday

router = APIRouter(prefix="/days", tags=["날짜별 미션"])

@router.get("/{date_str}/missions")
@router.get("/{date_str}")  # 레거시 호환
async def get_day_missions(
    date_str: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """특정 날짜의 미션 목록 조회 (일일 미션 + 주간 루틴 포함)"""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)"
        )
    
    # 일일 미션 조회
    day_missions = db.query(DayMission).filter(
        and_(
            DayMission.user_id == current_user.id,
            DayMission.date == target_date
        )
    ).all()
    
    # 관계 로드 (mission 정보 포함)
    for mission in day_missions:
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
    
    # 주간 루틴 조회 (해당 날짜가 속한 주의 월요일 루틴)
    week_start = get_monday_of_week(target_date)
    sunday = get_sunday_of_week(week_start)
    
    weekly_routines = db.query(WeeklyPersonalRoutine).filter(
        and_(
            WeeklyPersonalRoutine.user_id == current_user.id,
            WeeklyPersonalRoutine.week_start_date == week_start
        )
    ).all()
    
    # 주간 루틴을 DayMission 형태로 변환 (프론트엔드 호환)
    # start_date 기준으로 필터링: target_date >= start_date && target_date <= sunday
    routine_missions = []
    for routine in weekly_routines:
        # 선택한 날짜가 start_date부터 그 주 일요일 사이에 있어야 표시
        if not (routine.start_date <= target_date <= sunday):
            continue  # 이 날짜에는 이 루틴을 표시하지 않음
        _ = routine.mission  # 관계 로드
        if isinstance(routine.mission.submissions, str):
            try:
                routine.mission.submissions = json.loads(routine.mission.submissions)
            except Exception:
                routine.mission.submissions = [routine.mission.submissions]
        routine.mission.name = routine.sub_mission or (
            routine.mission.submissions[0]
            if isinstance(routine.mission.submissions, list) and routine.mission.submissions
            else routine.mission.category
        )
        
        # 주간 루틴을 DayMission 형식으로 변환
        # 실제로는 day_missions 테이블에 저장되지 않고 가상의 DayMission으로 변환
        mission_dict = {
            "id": routine.mission.id,
            "category": routine.mission.category,
            "submissions": routine.mission.submissions if isinstance(routine.mission.submissions, list) else json.loads(routine.mission.submissions) if isinstance(routine.mission.submissions, str) else [],
            "name": routine.mission.name if hasattr(routine.mission, 'name') and routine.mission.name else (routine.mission.submissions[0] if isinstance(routine.mission.submissions, list) and routine.mission.submissions else routine.mission.category)
        }
        routine_missions.append({
            "id": routine.id,
            "mission": mission_dict,
            "sub_mission": routine.sub_mission,
            "completed": False,  # 주간 루틴은 날짜별로 체크 가능하도록 day_missions에서 확인해야 함
            "date": target_date.isoformat(),
            "created_at": routine.created_at.isoformat() if routine.created_at else None,
            "is_weekly_routine": True,  # 주간 루틴임을 표시
            "routine_id": routine.id
        })
    
    # 일일 미션에 주간 루틴 정보 추가 (is_weekly_routine=False)
    result = []
    for mission in day_missions:
        mission_dict = {
            "id": mission.mission.id,
            "category": mission.mission.category,
            "submissions": mission.mission.submissions if isinstance(mission.mission.submissions, list) else json.loads(mission.mission.submissions) if isinstance(mission.mission.submissions, str) else [],
            "name": mission.mission.name if hasattr(mission.mission, 'name') and mission.mission.name else (mission.mission.submissions[0] if isinstance(mission.mission.submissions, list) and mission.mission.submissions else mission.mission.category)
        }
        result.append({
            "id": mission.id,
            "mission": mission_dict,
            "sub_mission": mission.sub_mission,
            "completed": mission.completed,
            "date": mission.date.isoformat(),
            "created_at": mission.created_at.isoformat() if mission.created_at else None,
            "is_weekly_routine": False
        })
    
    # 주간 루틴 추가 (이미 day_missions에 해당 날짜의 체크가 있으면 제외)
    existing_mission_keys = {(m.sub_mission, m.mission_id) for m in day_missions}
    for routine in routine_missions:
        routine_key = (routine["sub_mission"], routine["mission"]["id"])
        if routine_key not in existing_mission_keys:
            result.append(routine)
    
    return result

@router.post("/{date_str}/missions")
async def add_mission(
    date_str: str,
    mission_data: DayMissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """특정 날짜에 미션 추가 (주간 자동 생성 옵션 지원)"""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)"
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
    
    # submissions 검증
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

    # 주간 자동 생성 모드
    if mission_data.apply_until_end_of_week:
        # 선택한 날짜부터 그 주의 일요일까지 모든 날짜에 미션 추가
        sunday = get_sunday_of_week(target_date)
        created_dates = []
        skipped_dates = []
        
        current_date = target_date
        while current_date <= sunday:
            # 중복 확인
            existing = db.query(DayMission).filter(
                and_(
                    DayMission.user_id == current_user.id,
                    DayMission.date == current_date,
                    DayMission.sub_mission == submission
                )
            ).first()
            
            if existing:
                skipped_dates.append(current_date.isoformat())
            else:
                # 사용자별 하루 미션 수 제한 (최대 3개)
                day_count = db.query(DayMission).filter(
                    and_(
                        DayMission.user_id == current_user.id,
                        DayMission.date == current_date
                    )
                ).count()
                
                if day_count >= 3:
                    skipped_dates.append(current_date.isoformat())
                else:
                    # 미션 추가
                    day_mission = DayMission(
                        user_id=current_user.id,
                        mission_id=mission_data.mission_id,
                        date=current_date,
                        sub_mission=submission,
                        completed=False
                    )
                    db.add(day_mission)
                    created_dates.append(current_date.isoformat())
            
            current_date += timedelta(days=1)
        
        db.commit()
        
        return DayMissionBatchCreateResponse(
            mission_id=mission_data.mission_id,
            created_dates=created_dates,
            skipped=skipped_dates
        )
    
    # 기존 로직: 단일 날짜에만 추가
    # 오늘 날짜만 추가 가능 (주간 자동 생성이 아닌 경우)
    today = datetime.now(KST).date()
    if target_date != today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="오늘 날짜에만 미션을 추가할 수 있습니다"
        )
    
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


@router.get("/week-summary", response_model=List[DayCompletionSummary])
async def get_week_summary(
    date_str: Optional[str] = Query(None, description="기준 날짜 (YYYY-MM-DD, 기본값=오늘)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """특정 주간(월~일)의 완료 현황 요약"""
    if date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)",
            )
    else:
        target_date = datetime.now(KST).date()

    week_start = get_monday_of_week(target_date)
    sunday = get_sunday_of_week(week_start)

    day_missions = (
        db.query(DayMission)
        .filter(
            and_(
                DayMission.user_id == current_user.id,
                DayMission.date >= week_start,
                DayMission.date <= sunday,
            )
        )
        .all()
    )

    missions_by_date = {}
    for mission in day_missions:
        missions_by_date.setdefault(mission.date, []).append(mission)

    weekly_routines = (
        db.query(WeeklyPersonalRoutine)
        .filter(
            and_(
                WeeklyPersonalRoutine.user_id == current_user.id,
                WeeklyPersonalRoutine.week_start_date == week_start,
            )
        )
        .all()
    )

    summaries: List[DayCompletionSummary] = []
    current_date = week_start
    while current_date <= sunday:
        day_list = missions_by_date.get(current_date, [])
        total_missions = len(day_list)
        completed_missions = sum(1 for mission in day_list if mission.completed)

        existing_keys = {(mission.mission_id, mission.sub_mission) for mission in day_list}

        for routine in weekly_routines:
            if routine.start_date <= current_date <= sunday:
                routine_key = (routine.mission_id, routine.sub_mission)
                if routine_key not in existing_keys:
                    total_missions += 1

        completion_rate = (
            completed_missions / total_missions if total_missions > 0 else 0.0
        )
        is_perfect = total_missions > 0 and completed_missions == total_missions

        summaries.append(
            DayCompletionSummary(
                date=current_date,
                total_missions=total_missions,
                completed_missions=completed_missions,
                completion_rate=completion_rate,
                is_day_perfectly_complete=is_perfect,
            )
        )

        current_date += timedelta(days=1)

    return summaries

