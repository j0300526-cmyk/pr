# 카카오 소셜 로그인 라우터
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import TokenResponse, KakaoCallbackRequest
from auth import create_access_token, create_refresh_token, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta
import httpx
import os

router = APIRouter(prefix="/auth/kakao", tags=["카카오 로그인"])

KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID", "")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI", "http://localhost:5173/auth/kakao/callback")

@router.post("/callback", response_model=TokenResponse)
async def kakao_callback(request: KakaoCallbackRequest, db: Session = Depends(get_db)):
    """
    카카오 OAuth 콜백 처리
    프론트엔드에서 인가 코드를 받아서 이 엔드포인트로 전달
    """
    code = request.code
    if not KAKAO_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="카카오 클라이언트 ID가 설정되지 않았습니다"
        )
    
    # 1. 카카오 토큰 받기
    token_url = "https://kauth.kakao.com/oauth/token"
    token_data = {
        "grant_type": "authorization_code",
        "client_id": KAKAO_CLIENT_ID,
        "redirect_uri": KAKAO_REDIRECT_URI,
        "code": code,
    }
    
    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.post(token_url, data=token_data)
            token_response.raise_for_status()
            token_json = token_response.json()
            access_token = token_json.get("access_token")
            
            if not access_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="카카오 액세스 토큰을 받지 못했습니다"
                )
            
            # 2. 카카오 사용자 정보 받기
            user_info_url = "https://kapi.kakao.com/v2/user/me"
            headers = {"Authorization": f"Bearer {access_token}"}
            
            user_info_response = await client.get(user_info_url, headers=headers)
            user_info_response.raise_for_status()
            user_info = user_info_response.json()
            
            kakao_id = str(user_info.get("id"))
            kakao_account = user_info.get("kakao_account", {})
            profile = kakao_account.get("profile", {})
            
            email = kakao_account.get("email", f"kakao_{kakao_id}@temp.com")
            name = profile.get("nickname", "카카오 사용자")
            
            # 3. 기존 사용자 확인 또는 신규 생성
            user = db.query(User).filter(User.kakao_id == kakao_id).first()
            
            if not user:
                # 이메일로도 확인 (이메일 계정과 카카오 계정 연동)
                user = db.query(User).filter(User.email == email).first()
                if user:
                    # 기존 이메일 계정에 카카오 ID 연동
                    user.kakao_id = kakao_id
                else:
                    # 신규 사용자 생성
                    user = User(
                        email=email,
                        name=name,
                        kakao_id=kakao_id,
                        password_hash=None,  # 소셜 로그인 사용자는 비밀번호 없음
                        bio="카카오로 가입한 친환경 실천가!",
                    )
                    db.add(user)
                db.commit()
                db.refresh(user)
            
            # 4. JWT 토큰 생성
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token_jwt = create_access_token(
                data={"sub": str(user.id)}, expires_delta=access_token_expires
            )
            refresh_token_jwt = create_refresh_token(data={"sub": str(user.id)})
            
            print(f"[DEBUG] 카카오 로그인 성공: user_id={user.id}, kakao_id={kakao_id}")
            
            return TokenResponse(access=access_token_jwt, refresh=refresh_token_jwt)
            
        except httpx.HTTPStatusError as e:
            error_detail = "Unknown error"
            try:
                error_detail = e.response.json()
            except:
                error_detail = e.response.text
            print(f"[ERROR] 카카오 API 오류: {e}")
            print(f"[ERROR] 카카오 응답: {error_detail}")
            print(f"[DEBUG] 요청 파라미터: client_id={KAKAO_CLIENT_ID[:10]}..., redirect_uri={KAKAO_REDIRECT_URI}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"카카오 로그인 실패: {error_detail}"
            )
        except Exception as e:
            print(f"[ERROR] 카카오 로그인 처리 중 오류: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"카카오 로그인 처리 중 오류가 발생했습니다: {str(e)}"
            )

