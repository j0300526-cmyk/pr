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

# ===== 그룹 미션 =====
class GroupMissionBase(BaseModel):
    name: str
    color: Optional[str] = "bg-blue-300"

class GroupMissionCreate(GroupMissionBase):
    pass

class GroupMissionResponse(GroupMissionBase):
    id: int
    participants: List[str]  # 사용자 이름 목록
    total_score: Optional[int] = 0
    member_count: int
    
    class Config:
        from_attributes = True

class GroupMissionCheckRequest(BaseModel):
    date: date
    completed: bool

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

