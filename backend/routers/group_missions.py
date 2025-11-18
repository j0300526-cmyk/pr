# 그룹 미션 라우터
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from database import get_db
from models import GroupMission, GroupMember, GroupMissionCheck, User
from schemas import GroupMissionResponse, GroupMissionCheckRequest, GroupMissionCreate
from auth import get_current_user
from datetime import date, datetime
from typing import List, Optional

router = APIRouter(prefix="/group-missions", tags=["그룹 미션"])

# 상수: 규칙과 제한
MAX_MEMBERS_PER_GROUP = 3
MAX_GROUPS_PER_USER = 2

def group_mission_to_response(group: GroupMission, db: Session, checked: Optional[bool] = None) -> GroupMissionResponse:
    """GroupMission 모델을 응답 스키마로 변환"""
    # 참여자 이름 목록
    participants = [member.user.name for member in group.members]
    
    # 총 점수 계산 (간단한 예시, 실제로는 더 복잡한 로직 필요)
    total_score = db.query(func.count(GroupMissionCheck.id)).filter(
        GroupMissionCheck.group_mission_id == group.id,
        GroupMissionCheck.completed == True
    ).scalar() or 0
    
    return GroupMissionResponse(
        id=group.id,
        name=group.name,
        color=group.color,
        participants=participants,
        total_score=total_score * 2,  # 그룹 미션은 2점
        member_count=len(participants),
        checked=checked
    )

@router.get("/my", response_model=List[GroupMissionResponse])
async def get_my_groups(
    date: Optional[str] = Query(None, description="날짜 (YYYY-MM-DD 형식, 선택적)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """내가 참여 중인 그룹 미션 목록 (선택적 날짜별 체크 상태 포함)"""
    memberships = db.query(GroupMember).filter(
        GroupMember.user_id == current_user.id
    ).all()
    
    groups = [membership.group_mission for membership in memberships]
    
    # 날짜가 제공된 경우 각 그룹의 체크 상태 포함
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
            result = []
            for group in groups:
                check = db.query(GroupMissionCheck).filter(
                    and_(
                        GroupMissionCheck.group_mission_id == group.id,
                        GroupMissionCheck.user_id == current_user.id,
                        GroupMissionCheck.date == target_date
                    )
                ).first()
                checked_status = check.completed if check else False
                result.append(group_mission_to_response(group, db, checked=checked_status))
            return result
        except ValueError:
            # 날짜 형식이 잘못된 경우 체크 상태 없이 반환
            pass
    
    # 날짜가 없거나 파싱 실패 시 체크 상태 없이 반환
    return [group_mission_to_response(group, db) for group in groups]


@router.get("/", response_model=List[GroupMissionResponse])
async def get_all_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """전체 그룹 목록 조회 (개발/프론트에서 목록을 동적으로 가져오도록 사용)"""
    groups = db.query(GroupMission).all()
    return [group_mission_to_response(group, db) for group in groups]

@router.get("/recommended", response_model=List[GroupMissionResponse])
async def get_recommended(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """추천 그룹 미션 목록"""
    # 내가 참여하지 않은 그룹 중 인원이 3명 미만인 그룹
    my_group_ids = db.query(GroupMember.group_mission_id).filter(
        GroupMember.user_id == current_user.id
    ).subquery()
    
    groups = db.query(GroupMission).filter(
        ~GroupMission.id.in_(my_group_ids)
    ).all()
    
    # 인원이 3명 미만인 그룹만 필터링
    recommended = []
    for group in groups:
        member_count = len(group.members)
        if member_count < 3:
            recommended.append(group_mission_to_response(group, db))
    
    return recommended


@router.post("/", response_model=GroupMissionResponse)
async def create_group(
    group_in: GroupMissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """그룹 미션 생성"""
    group = GroupMission(
        name=group_in.name,
        color=group_in.color,
        created_by=current_user.id,
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return group_mission_to_response(group, db)

@router.get("/{group_id}", response_model=GroupMissionResponse)
async def get_group_detail(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """그룹 미션 상세 정보"""
    group = db.query(GroupMission).filter(GroupMission.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 그룹입니다"
        )
    
    return group_mission_to_response(group, db)

@router.post("/{group_id}/join", response_model=GroupMissionResponse)
async def join_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """그룹 미션 참여"""
    print("[DEBUG] join_group called", "group_id=", group_id, "user_id=", current_user.id)

    # 1) 그룹 존재 확인
    group = db.query(GroupMission).filter(GroupMission.id == group_id).first()
    if group is None:
        print("[DEBUG] group not found:", group_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="그룹을 찾을 수 없습니다.",
        )
    
    # 이미 참여 중인지 확인
    existing = db.query(GroupMember).filter(
        and_(
            GroupMember.group_mission_id == group_id,
            GroupMember.user_id == current_user.id
        )
    ).first()
    if existing:
        print("[DEBUG] already joined:", "user_id=", current_user.id, "group_id=", group_id)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 이 그룹에 참여 중입니다.",
        )
    # 사용자별 참여 그룹 수 제한 확인
    user_group_count = db.query(GroupMember).filter(
        GroupMember.user_id == current_user.id
    ).count()
    if user_group_count >= MAX_GROUPS_PER_USER:
        print("[DEBUG] user reached max groups:", current_user.id, user_group_count)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"사용자는 최대 {MAX_GROUPS_PER_USER}개의 그룹에만 참여할 수 있습니다"
        )
    
    # 인원 확인 (최대 3명)
    member_count = db.query(GroupMember).filter(
        GroupMember.group_mission_id == group_id
    ).count()
    if member_count >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="그룹 미션은 최대 3명까지 참여할 수 있습니다"
        )
    
    # 5) 실제 참여 추가
    membership = GroupMember(
        group_mission_id=group_id,
        user_id=current_user.id
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)

    print("[DEBUG] join success: membership_id=", membership.id)

    return group_mission_to_response(group, db)

@router.delete("/{group_id}/leave")
async def leave_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """그룹 미션 나가기"""
    member = db.query(GroupMember).filter(
        and_(
            GroupMember.group_mission_id == group_id,
            GroupMember.user_id == current_user.id
        )
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="참여하지 않은 그룹입니다"
        )
    
    db.delete(member)
    db.commit()
    return {"message": "그룹에서 나갔습니다"}

@router.post("/{group_id}/check")
async def check_group_mission(
    group_id: int,
    check_data: GroupMissionCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """그룹 미션 완료 체크"""
    # 그룹 참여 확인
    member = db.query(GroupMember).filter(
        and_(
            GroupMember.group_mission_id == group_id,
            GroupMember.user_id == current_user.id
        )
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="참여하지 않은 그룹입니다"
        )
    
    # 체크 기록 확인/생성
    check = db.query(GroupMissionCheck).filter(
        and_(
            GroupMissionCheck.group_mission_id == group_id,
            GroupMissionCheck.user_id == current_user.id,
            GroupMissionCheck.date == check_data.date
        )
    ).first()
    
    if check:
        check.completed = check_data.completed
    else:
        check = GroupMissionCheck(
            group_mission_id=group_id,
            user_id=current_user.id,
            date=check_data.date,
            completed=check_data.completed
        )
        db.add(check)
    
    db.commit()
    return {"message": "완료 상태가 업데이트되었습니다"}

