# 백엔드 설정 가이드

## ✅ 완료된 작업
- ✅ 가상환경 생성
- ✅ 패키지 설치 완료

## 📝 다음 단계

### 1. .env 파일 생성

`backend` 폴더에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 데이터베이스 설정
DATABASE_URL=sqlite:///./zero_waste.db

# JWT 설정
SECRET_KEY=your-secret-key-change-in-production-please-use-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS 설정
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 2. 가상환경 활성화

터미널에서 다음 명령을 실행하세요:

```bash
cd backend
venv\Scripts\activate  # Windows
# 또는
source venv/bin/activate  # Mac/Linux
```

### 3. 데이터베이스 테스트

```bash
python test_db.py
```

### 4. 초기 데이터 삽입 (선택사항)

```bash
python init_data.py
```

이 명령은:
- 미션 카탈로그 데이터 추가
- 테스트 사용자 생성 (이메일: test@example.com, 비밀번호: test1234)

### 5. 서버 실행

```bash
python main.py
```

또는:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

서버가 실행되면:
- API: http://localhost:8000/api
- API 문서: http://localhost:8000/docs
- 대체 문서: http://localhost:8000/redoc

## 🔍 문제 해결

### 가상환경이 활성화되지 않는 경우

Windows에서:
```bash
venv\Scripts\Activate.ps1
```

만약 실행 정책 오류가 발생하면:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 패키지가 설치되지 않는 경우

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

