# 친구/초대 라우터
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from database import get_db
from models import User, Friend, Invite, GroupMission, GroupMember
from schemas import FriendResponse, InviteResponse, InviteRequest
from auth import get_current_user
from datetime import date, timedelta

router = APIRouter(prefix="", tags=["친구/초대"])

@router.get("/friends", response_model=list[FriendResponse])
async def get_friends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """친구 목록 조회"""
    # 친구 관계 조회 (양방향)
    friend_relations = db.query(Friend).filter(
        (Friend.user_id == current_user.id) | (Friend.friend_id == current_user.id)
    ).all()
    
    friend_ids = set()
    for relation in friend_relations:
        if relation.user_id == current_user.id:
            friend_ids.add(relation.friend_id)
        else:
            friend_ids.add(relation.user_id)
    
    friends = db.query(User).filter(User.id.in_(friend_ids)).all()
    
    # 활성일 계산 (최근 30일간 미션 수행한 날짜 수)
    result = []
    for friend in friends:
        from models import DayMission
        thirty_days_ago = date.today() - timedelta(days=30)
        active_days = db.query(func.count(func.distinct(DayMission.date))).filter(
            and_(
                DayMission.user_id == friend.id,
                DayMission.date >= thirty_days_ago,
                DayMission.completed == True
            )
        ).scalar() or 0
        
        result.append(FriendResponse(
            id=friend.id,
            name=friend.name,
            activeDays=active_days,
            profileColor=friend.profile_color
        ))
    
    return result

@router.post("/group-missions/{group_id}/invite")
async def send_invite(
    group_id: int,
    invite_data: InviteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """그룹 미션 초대 보내기"""
    # 그룹 확인
    group = db.query(GroupMission).filter(GroupMission.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 그룹입니다"
        )
    
    # 그룹 인원 확인
    member_count = db.query(GroupMember).filter(
        GroupMember.group_mission_id == group_id
    ).count()
    if member_count + len(invite_data.friend_ids) > 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="그룹 인원이 가득 찼습니다"
        )
    
    # 초대 생성
    for friend_id in invite_data.friend_ids:
        # 중복 초대 확인
        existing = db.query(Invite).filter(
            and_(
                Invite.group_mission_id == group_id,
                Invite.to_user_id == friend_id,
                Invite.status == "pending"
            )
        ).first()
        if existing:
            continue
        
        invite = Invite(
            group_mission_id=group_id,
            from_user_id=current_user.id,
            to_user_id=friend_id,
            status="pending"
        )
        db.add(invite)
    
    db.commit()
    return {"message": "초대가 전송되었습니다", "invited_count": len(invite_data.friend_ids)}

@router.get("/invites/received", response_model=list[InviteResponse])
async def get_invites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """받은 초대 목록"""
    invites = db.query(Invite).filter(
        and_(
            Invite.to_user_id == current_user.id,
            Invite.status == "pending"
        )
    ).all()
    
    result = []
    for invite in invites:
        from routers.group_missions import group_mission_to_response
        group_response = group_mission_to_response(invite.group_mission, db)
        
        from_user_response = FriendResponse(
            id=invite.from_user.id,
            name=invite.from_user.name,
            activeDays=0,  # 계산 필요
            profileColor=invite.from_user.profile_color
        )
        
        result.append(InviteResponse(
            id=invite.id,
            group_mission=group_response,
            from_user=from_user_response,
            created_at=invite.created_at
        ))
    
    return result

@router.post("/invites/{invite_id}/accept")
async def accept_invite(
    invite_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """초대 수락"""
    invite = db.query(Invite).filter(
        and_(
            Invite.id == invite_id,
            Invite.to_user_id == current_user.id,
            Invite.status == "pending"
        )
    ).first()
    
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 초대입니다"
        )
    
    # 그룹 인원 확인
    member_count = db.query(GroupMember).filter(
        GroupMember.group_mission_id == invite.group_mission_id
    ).count()
    if member_count >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="그룹 인원이 가득 찼습니다"
        )
    
    # 그룹 참여
    member = GroupMember(
        group_mission_id=invite.group_mission_id,
        user_id=current_user.id
    )
    db.add(member)
    
    # 초대 상태 변경
    invite.status = "accepted"
    db.commit()
    
    from routers.group_missions import group_mission_to_response
    group = db.query(GroupMission).filter(
        GroupMission.id == invite.group_mission_id
    ).first()
    
    return {
        "message": "초대를 수락했습니다",
        "group_mission": group_mission_to_response(group, db)
    }

@router.delete("/invites/{invite_id}/decline")
async def decline_invite(
    invite_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """초대 거절"""
    invite = db.query(Invite).filter(
        and_(
            Invite.id == invite_id,
            Invite.to_user_id == current_user.id,
            Invite.status == "pending"
        )
    ).first()
    
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 초대입니다"
        )
    
    invite.status = "declined"
    db.commit()
    return {"message": "초대를 거절했습니다"}

