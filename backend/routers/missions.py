# 미션 카탈로그 라우터
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import CatalogMission
from schemas import CatalogMissionResponse
from auth import get_current_user
import json
import os


router = APIRouter(prefix="/missions", tags=["미션"])

@router.get("/catalog", response_model=list[CatalogMissionResponse])
async def get_catalog(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """사용 가능한 미션 카탈로그 조회"""
    missions = db.query(CatalogMission).all()
    
    # submissions JSON 문자열을 리스트로 변환 + name 필드 채우기
    for mission in missions:
        if isinstance(mission.submissions, str):
            mission.submissions = json.loads(mission.submissions)
        # 프론트 호환용 name 필드 (첫 번째 예시 또는 카테고리명)
        mission.name = (
            mission.submissions[0]
            if isinstance(mission.submissions, list) and mission.submissions
            else mission.category
        )
    
    return missions

