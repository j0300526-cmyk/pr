# 인증 관련 라우터
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import LoginRequest, TokenResponse, RefreshTokenRequest
from auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    get_current_user,
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from datetime import timedelta
import jwt

router = APIRouter(prefix="/auth", tags=["인증"])

@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """이메일/비밀번호 로그인"""
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다"
        )
    
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    # JWT의 sub 필드는 문자열이어야 함
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # 디버깅: 토큰 생성 확인
    print(f"[DEBUG] 로그인 성공: user_id={user.id}")
    print(f"[DEBUG] SECRET_KEY (처음 20자): {SECRET_KEY[:20] if SECRET_KEY else 'None'}...")
    print(f"[DEBUG] ALGORITHM: {ALGORITHM}")
    print(f"[DEBUG] access_token (처음 50자): {access_token[:50]}...")
    print(f"[DEBUG] refresh_token (처음 50자): {refresh_token[:50]}...")
    
    return TokenResponse(access=access_token, refresh=refresh_token)

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """토큰 갱신"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="유효하지 않은 토큰입니다"
    )
    
    try:
        payload = jwt.decode(refresh_data.refresh, SECRET_KEY, algorithms=[ALGORITHM])
        # sub는 문자열로 저장되므로 정수로 변환
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id: int = int(user_id_str)
        token_type: str = payload.get("type")
        
        if token_type != "refresh":
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    # JWT의 sub 필드는 문자열이어야 함
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return TokenResponse(access=access_token, refresh=refresh_token)

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """로그아웃 (클라이언트에서 토큰 삭제)"""
    return {"message": "로그아웃되었습니다"}

@router.post("/{provider}")
async def social_login(
    provider: str,
    code: str,
    db: Session = Depends(get_db)
):
    """소셜 로그인 (카카오, 구글, 네이버)"""
    # TODO: 소셜 로그인 구현
    # 1. provider별로 OAuth 인증 코드를 액세스 토큰으로 교환
    # 2. 액세스 토큰으로 사용자 정보 가져오기
    # 3. 사용자가 없으면 생성, 있으면 로그인
    # 4. JWT 토큰 발급
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"{provider} 소셜 로그인은 아직 구현되지 않았습니다"
    )

