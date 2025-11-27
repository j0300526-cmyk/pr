# SQLAlchemy 데이터베이스 모델
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # 소셜 로그인 사용자는 null
    name = Column(String, nullable=False)
    profile_color = Column(String, default="bg-green-300")
    bio = Column(Text, default="친환경 실천 중!")
    kakao_id = Column(String, unique=True, nullable=True, index=True)  # 카카오 소셜 로그인 ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 관계
    day_missions = relationship("DayMission", back_populates="user")
    weekly_routines = relationship("WeeklyPersonalRoutine", back_populates="user")
    group_memberships = relationship("GroupMember", back_populates="user")
    sent_invites = relationship("Invite", foreign_keys="Invite.from_user_id", back_populates="from_user")
    received_invites = relationship("Invite", foreign_keys="Invite.to_user_id", back_populates="to_user")
    group_checks = relationship("GroupMissionCheck", back_populates="user")

class CatalogMission(Base):
    __tablename__ = "catalog_missions"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)
    submissions = Column(Text, nullable=False)  # JSON 배열 문자열: ["텀블러 사용하기", "장바구니 챙기기", ...]
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계 제거 (CatalogMission 테이블이 없으므로)
    # day_missions = relationship("DayMission", back_populates="mission")
    # weekly_routines = relationship("WeeklyPersonalRoutine", back_populates="mission")

class DayMission(Base):
    __tablename__ = "day_missions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # 실제 DB는 catalog_subtopics를 참조하지만, 스키마 변경 불가로 외래키 제약조건 제거
    # 프론트엔드에서 보낸 mission_id를 그대로 저장 (검증은 백엔드에서 수행)
    mission_id = Column(Integer, nullable=False)  # ForeignKey 제거
    date = Column(Date, nullable=False, index=True)
    sub_mission = Column(String, nullable=False, default="")
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계
    user = relationship("User", back_populates="day_missions")
    # CatalogMission 테이블이 없으므로 관계 제거
    # mission = relationship("CatalogMission", back_populates="day_missions")
    
    # 복합 유니크 제약: 같은 날 같은 소주제는 한 번만
    __table_args__ = (
        UniqueConstraint('user_id', 'date', 'sub_mission', name='uq_user_date_sub_mission'),
    )

class GroupMission(Base):
    __tablename__ = "group_missions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    color = Column(String, default="bg-blue-300")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계
    members = relationship("GroupMember", back_populates="group_mission", cascade="all, delete-orphan")
    checks = relationship("GroupMissionCheck", back_populates="group_mission", cascade="all, delete-orphan")

class GroupMember(Base):
    __tablename__ = "group_members"
    
    id = Column(Integer, primary_key=True, index=True)
    group_mission_id = Column(Integer, ForeignKey("group_missions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계
    group_mission = relationship("GroupMission", back_populates="members")
    user = relationship("User", back_populates="group_memberships")
    
    # 복합 유니크: 한 그룹에 한 사용자는 한 번만
    __table_args__ = (
        UniqueConstraint('group_mission_id', 'user_id', name='uq_group_user'),
    )

class GroupMissionCheck(Base):
    __tablename__ = "group_mission_checks"
    
    id = Column(Integer, primary_key=True, index=True)
    group_mission_id = Column(Integer, ForeignKey("group_missions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계
    group_mission = relationship("GroupMission", back_populates="checks")
    user = relationship("User", back_populates="group_checks")
    
    # 복합 유니크: 같은 날 같은 그룹 미션은 한 번만 체크
    __table_args__ = (
        UniqueConstraint('group_mission_id', 'user_id', 'date', name='uq_group_user_date'),
    )

class Invite(Base):
    __tablename__ = "invites"
    
    id = Column(Integer, primary_key=True, index=True)
    group_mission_id = Column(Integer, ForeignKey("group_missions.id"), nullable=False)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")  # pending, accepted, declined
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계
    group_mission = relationship("GroupMission")
    from_user = relationship("User", foreign_keys=[from_user_id], back_populates="sent_invites")
    to_user = relationship("User", foreign_keys=[to_user_id], back_populates="received_invites")

class Friend(Base):
    __tablename__ = "friends"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    friend_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 복합 유니크: 친구 관계는 한 번만
    __table_args__ = (
        UniqueConstraint('user_id', 'friend_id', name='uq_friends'),
    )

class WeeklyPersonalRoutine(Base):
    __tablename__ = "weekly_personal_routines"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # 실제 DB는 catalog_subtopics를 참조하지만, 스키마 변경 불가로 외래키 제약조건 제거
    # 프론트엔드에서 보낸 mission_id를 그대로 저장 (검증은 백엔드에서 수행)
    mission_id = Column(Integer, nullable=False)  # ForeignKey 제거
    sub_mission = Column(String, nullable=False, default="")
    week_start_date = Column(Date, nullable=False, index=True)  # 해당 주의 월요일 날짜 (조회/그룹화 기준)
    start_date = Column(Date, nullable=False, index=True)  # 사용자가 실제로 루틴을 추가한 날짜 (표시 시작 기준)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계
    user = relationship("User", back_populates="weekly_routines")
    # CatalogMission 테이블이 없으므로 관계 제거
    # mission = relationship("CatalogMission", back_populates="weekly_routines")
    
    # 복합 유니크: 같은 주에 같은 미션은 한 번만 (sub_mission 제외)
    __table_args__ = (
        UniqueConstraint(
            'user_id',
            'week_start_date',
            'mission_id',
            'sub_mission',
            name='uq_user_week_mission_submission'
        ),
    )

