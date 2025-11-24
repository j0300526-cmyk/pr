# 주간 개인 루틴 라우터
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database import get_db
from models import WeeklyPersonalRoutine, CatalogMission, User
from schemas import WeeklyPersonalRoutineResponse, WeeklyPersonalRoutineCreate
from auth import get_current_user
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo
import json

# KST(Asia/Seoul) 타임존 설정
KST = ZoneInfo("Asia/Seoul")

router = APIRouter(prefix="/personal-routines", tags=["주간 개인 루틴"])

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

@router.post("", response_model=WeeklyPersonalRoutineResponse)
async def add_weekly_routine(
    routine_data: WeeklyPersonalRoutineCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """주간 개인 루틴 추가 (선택한 날짜부터 그 주 일요일까지)"""
    # 미션 카탈로그 확인
    mission = db.query(CatalogMission).filter(
        CatalogMission.id == routine_data.mission_id
    ).first()
    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 미션입니다"
        )
    
    # 요청으로 들어온 date가 속한 주의 월요일 계산
    week_start_date = get_monday_of_week(routine_data.date)
    start_date = routine_data.date
    
    # start_date가 week_start_date와 같은 주에 속하는지 확인
    sunday = get_sunday_of_week(week_start_date)
    if not (week_start_date <= start_date <= sunday):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date가 week_start_date와 같은 주에 속하지 않습니다"
        )
    
    # 요청 본문의 submission이 있으면 사용, 없으면 카탈로그의 첫 번째 예시 사용
    requested_submission = (routine_data.submission or "").strip()
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
    
    fallback_submission = submissions_list[0] if submissions_list else mission.category
    sub_mission = requested_submission or fallback_submission
    
    # 중복 확인: 같은 유저, 같은 주, 같은 미션이 이미 있으면 기존 데이터 반환
    existing = db.query(WeeklyPersonalRoutine).filter(
        and_(
            WeeklyPersonalRoutine.user_id == current_user.id,
            WeeklyPersonalRoutine.week_start_date == week_start_date,
            WeeklyPersonalRoutine.mission_id == routine_data.mission_id,
            WeeklyPersonalRoutine.sub_mission == sub_mission
        )
    ).first()
    
    if existing:
        # 기존 데이터 반환
        return existing
    
    # 새 루틴 추가
    routine = WeeklyPersonalRoutine(
        user_id=current_user.id,
        mission_id=routine_data.mission_id,
        sub_mission=sub_mission,
        week_start_date=week_start_date,
        start_date=start_date
    )
    db.add(routine)
    db.commit()
    db.refresh(routine)
    
    return routine

@router.get("", response_model=list[WeeklyPersonalRoutineResponse])
async def get_week_routines(
    week_start_date: date = Query(None, description="해당 주의 월요일 날짜 (없으면 오늘이 속한 주)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """특정 주의 주간 루틴 조회"""
    # week_start_date가 없으면 오늘이 속한 주의 월요일 사용
    if week_start_date is None:
        today = datetime.now(KST).date()
        week_start_date = get_monday_of_week(today)
    
    routines = db.query(WeeklyPersonalRoutine).filter(
        and_(
            WeeklyPersonalRoutine.user_id == current_user.id,
            WeeklyPersonalRoutine.week_start_date == week_start_date
        )
    ).all()
    
    return routines

@router.get("/week/{date_str}", response_model=list[WeeklyPersonalRoutineResponse])
async def get_week_routines_by_date(
    date_str: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """특정 날짜가 속한 주의 주간 루틴 조회 (레거시 호환)"""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)"
        )
    
    # 해당 날짜가 속한 주의 월요일 날짜
    week_start = get_monday_of_week(target_date)
    
    routines = db.query(WeeklyPersonalRoutine).filter(
        and_(
            WeeklyPersonalRoutine.user_id == current_user.id,
            WeeklyPersonalRoutine.week_start_date == week_start
        )
    ).all()
    
    return routines

@router.delete("/{routine_id}")
async def delete_weekly_routine(
    routine_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """주간 루틴 삭제"""
    routine = db.query(WeeklyPersonalRoutine).filter(
        and_(
            WeeklyPersonalRoutine.id == routine_id,
            WeeklyPersonalRoutine.user_id == current_user.id
        )
    ).first()
    
    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 루틴입니다"
        )
    
    db.delete(routine)
    db.commit()
    return {"message": "주간 루틴이 삭제되었습니다"}
