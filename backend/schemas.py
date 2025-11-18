# Pydantic 스키마 (요청/응답 모델)
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

# ===== 인증 =====
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access: str
    refresh: str

class RefreshTokenRequest(BaseModel):
    refresh: str

class KakaoCallbackRequest(BaseModel):
    code: str

# ===== 사용자 =====
class UserBase(BaseModel):
    name: str
    profile_color: Optional[str] = "bg-green-300"
    bio: Optional[str] = "친환경 실천 중!"

class UserCreate(UserBase):
    email: EmailStr
    password: Optional[str] = None  # 소셜 로그인은 비밀번호 없음

class UserUpdate(BaseModel):
    name: Optional[str] = None
    profile_color: Optional[str] = None
    bio: Optional[str] = None

class UserResponse(UserBase):
    id: int
    email: Optional[str] = None
    
    class Config:
        from_attributes = True

# ===== 미션 카탈로그 =====
class CatalogMissionBase(BaseModel):
    category: str
    submissions: List[str]  # ["텀블러 사용하기", "장바구니 챙기기", ...]
    name: Optional[str] = None  # 프론트 표시용 (없으면 submissions[0] 사용)

class CatalogMissionResponse(CatalogMissionBase):
    id: int
    
    class Config:
        from_attributes = True

# ===== 날짜별 미션 =====
class DayMissionBase(BaseModel):
    date: date
    completed: bool = False

class DayMissionCreate(BaseModel):
    mission_id: int
    submission: str
    apply_until_end_of_week: Optional[bool] = False  # 선택한 날짜부터 그 주 일요일까지 자동 생성

class DayMissionResponse(BaseModel):
    id: int
    mission: CatalogMissionResponse
    sub_mission: str
    completed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class DayMissionUpdate(BaseModel):
    completed: bool

class DayMissionBatchCreateResponse(BaseModel):
    """주간 자동 생성 응답"""
    mission_id: int
    created_dates: list[str]  # YYYY-MM-DD 형식
    skipped: list[str]  # 이미 존재해서 건너뛴 날짜들

# ===== 그룹 미션 =====
class GroupMissionBase(BaseModel):
    name: str
    color: Optional[str] = "bg-blue-300"

class GroupMissionCreate(GroupMissionBase):
    pass

class GroupParticipantResponse(BaseModel):
    id: int
    name: str
    profile_color: Optional[str] = None

    class Config:
        from_attributes = True


class GroupMissionResponse(GroupMissionBase):
    id: int
    participants: List[GroupParticipantResponse]  # 사용자 정보 목록
    total_score: Optional[int] = 0
    member_count: int
    checked: Optional[bool] = None  # 날짜별 체크 상태 (선택적)
    
    class Config:
        from_attributes = True

class GroupMissionCheckRequest(BaseModel):
    date: date
    completed: bool

# ===== 완료 요약 =====
class DayCompletionSummary(BaseModel):
    date: date
    total_missions: int
    completed_missions: int
    completion_rate: float
    is_day_perfectly_complete: bool

# ===== 친구/초대 =====
class FriendResponse(BaseModel):
    id: int
    name: str
    activeDays: int
    profileColor: Optional[str] = None
    
    class Config:
        from_attributes = True

class InviteResponse(BaseModel):
    id: int
    group_mission: GroupMissionResponse
    from_user: FriendResponse
    created_at: datetime
    
    class Config:
        from_attributes = True

class InviteRequest(BaseModel):
    friend_ids: List[int]

# ===== 랭킹 =====
class RankingUserResponse(BaseModel):
    id: int
    name: str
    score: int
    streak: int
    profile_color: str
    
    class Config:
        from_attributes = True

class MyRankResponse(BaseModel):
    personal_rank: int
    group_ranks: List[dict]  # [{"group_id": 1, "rank": 2}]

# ===== 주간 개인 루틴 =====
class WeeklyPersonalRoutineCreate(BaseModel):
    mission_id: int
    date: date  # 사용자가 루틴을 추가한 실제 날짜

class WeeklyPersonalRoutineResponse(BaseModel):
    id: int
    user_id: int
    mission_id: int
    week_start_date: date  # 해당 주의 월요일
    start_date: date  # 사용자가 실제로 루틴을 추가한 날짜
    created_at: datetime
    
    class Config:
        from_attributes = True

