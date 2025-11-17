# JWT 인증 및 비밀번호 해싱
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models import User
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """비밀번호 해싱"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Access Token 생성"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    """Refresh Token 생성"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """현재 로그인한 사용자 가져오기"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보를 확인할 수 없습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 디버깅: 토큰 확인
    print("[DEBUG] get_current_user 호출됨")
    print(f"[DEBUG] raw token (처음 50자): {token[:50] if token else 'None'}...")
    print(f"[DEBUG] SECRET_KEY: {SECRET_KEY[:20] if SECRET_KEY else 'None'}...")
    print(f"[DEBUG] ALGORITHM: {ALGORITHM}")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"[DEBUG] decoded payload: {payload}")
        
        # sub는 문자열로 저장되므로 정수로 변환
        user_id_str = payload.get("sub")
        if user_id_str is None:
            print(f"[DEBUG] ❌ payload에 'sub'가 없음")
            raise credentials_exception
        
        user_id: int = int(user_id_str)
        token_type: str = payload.get("type")
        
        print(f"[DEBUG] user_id: {user_id}, token_type: {token_type}")
        
        if token_type != "access":
            print(f"[DEBUG] ❌ 토큰 검증 실패: user_id={user_id}, token_type={token_type}")
            raise credentials_exception
    except JWTError as e:
        print(f"[DEBUG] ❌ JWTError 발생: {repr(e)}")
        raise credentials_exception
    except Exception as e:
        print(f"[DEBUG] ❌ 예상치 못한 에러: {repr(e)}")
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        print(f"[DEBUG] ❌ 사용자를 찾을 수 없음: user_id={user_id}")
        raise credentials_exception
    
    print(f"[DEBUG] ✅ 인증 성공: user_id={user_id}, name={user.name}")
    return user

