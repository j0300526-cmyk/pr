# 미션 카탈로그 라우터
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas import CatalogMissionResponse
from auth import get_current_user


router = APIRouter(prefix="/missions", tags=["미션"])

@router.get("/catalog", response_model=list[CatalogMissionResponse])
async def get_catalog(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """사용 가능한 미션 카탈로그 조회 (프론트엔드에서 하드코딩된 데이터 사용)"""
    # 프론트엔드에서 하드코딩된 데이터를 사용하므로 빈 배열 반환
    # DB 스키마 변경 없이 작동하도록 함
    return []

