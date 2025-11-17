# 디버깅용 라우터 (개발 환경에서만 사용)
from fastapi import APIRouter, Request, Header
from typing import Optional

router = APIRouter(prefix="/debug", tags=["디버깅"])

@router.get("/headers")
async def debug_headers(request: Request, authorization: Optional[str] = Header(None)):
    """요청 헤더 확인 (디버깅용)"""
    return {
        "headers": dict(request.headers),
        "authorization": authorization,
        "cookies": dict(request.cookies),
    }

