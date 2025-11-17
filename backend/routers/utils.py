# 유틸리티 라우터
from fastapi import APIRouter, Depends
from datetime import date
from auth import get_current_user

router = APIRouter(prefix="", tags=["유틸리티"])

@router.get("/server/date")
async def get_server_date(current_user = Depends(get_current_user)):
    """서버 현재 날짜 조회"""
    return date.today().isoformat()

