# Zero Waste Routine Backend

FastAPI 기반 백엔드 서버

## ⚠️ 중요: 가상환경 위치

**백엔드 코드는 `pr_11_15_VER1/backend/`에 있습니다.**

가상환경은 다음 중 하나를 선택하세요:

### 옵션 1: backend 폴더 안에 가상환경 생성 (권장)
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# 또는
source venv/bin/activate  # Mac/Linux
```

### 옵션 2: 기존 src/venv 사용
이미 `src/venv/`에 FastAPI가 설치되어 있다면 그대로 사용 가능합니다.
```bash
cd src
venv\Scripts\activate  # Windows
# 또는
source venv/bin/activate  # Mac/Linux
cd ../backend  # 백엔드 폴더로 이동
```

## 설치 및 실행

### 1. 가상환경 활성화 후 패키지 설치

```bash
# 가상환경이 활성화된 상태에서
pip install -r requirements.txt
```

### 2. 환경 변수 설정

`backend` 폴더에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
# 데이터베이스 (SQLite 사용 시)
DATABASE_URL=sqlite:///./zero_waste.db

# 또는 PostgreSQL 사용 시
# DATABASE_URL=postgresql://user:password@localhost:5432/zero_waste_db

# JWT 설정
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS 설정
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. 데이터베이스 초기화

SQLite를 사용하는 경우 자동으로 생성됩니다.
PostgreSQL을 사용하는 경우 데이터베이스를 먼저 생성하세요:

```sql
CREATE DATABASE zero_waste_db;
```

### 4. 초기 데이터 삽입 (선택사항)

```bash
python init_data.py
```

또는 그룹/테스트 관련 추가 스크립트:

```bash
python seed_groups.py     # group_missions 테이블에 테스트 그룹 3개 추가
python test_group_join.py # 그룹 / 멤버 현황 출력 (간단 점검용)
```

### 5. 서버 실행

```bash
python main.py
```

또는 uvicorn 직접 사용:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

서버가 실행되면:
- API: http://localhost:8000/api
- API 문서: http://localhost:8000/docs
- 대체 문서: http://localhost:8000/redoc

## 프로젝트 구조

```
pr_11_15_VER1/
├── backend/          # 백엔드 코드 (여기!)
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── routers/
│   ├── requirements.txt
│   └── .env          # 환경 변수 (직접 생성)
├── src/              # 프론트엔드 코드
│   └── venv/         # 프론트엔드용 가상환경 (선택사항)
└── ...
```

## API 엔드포인트

모든 API는 `/api` prefix를 사용합니다.

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `POST /api/auth/logout` - 로그아웃

### 사용자
- `GET /api/users/me` - 현재 사용자 정보
- `PUT /api/users/me` - 프로필 업데이트

### 미션
- `GET /api/missions/catalog` - 미션 카탈로그
- `GET /api/days/{date}/missions` - 날짜별 미션 조회
- `POST /api/days/{date}/missions` - 미션 추가
- `DELETE /api/days/{date}/missions/{id}` - 미션 삭제
- `PATCH /api/days/{date}/missions/{id}/complete` - 완료 상태 토글

### 그룹 미션
- `GET /api/group-missions/my` - 내 그룹 목록
- `GET /api/group-missions/recommended` - 추천 그룹
- `POST /api/group-missions/{id}/join` - 그룹 참여
- `DELETE /api/group-missions/{id}/leave` - 그룹 나가기
- `POST /api/group-missions/{id}/check` - 완료 체크

### 친구/초대
- `GET /api/friends` - 친구 목록
- `POST /api/group-missions/{id}/invite` - 초대 보내기
- `GET /api/invites/received` - 받은 초대
- `POST /api/invites/{id}/accept` - 초대 수락
- `DELETE /api/invites/{id}/decline` - 초대 거절

### 랭킹
- `GET /api/ranking/personal` - 개인 랭킹
- `GET /api/ranking/group` - 그룹 랭킹
- `GET /api/ranking/my` - 내 순위

### 유틸리티
- `GET /api/server/date` - 서버 현재 날짜

## 개발 팁

1. **데이터베이스 초기 데이터**: `init_data.py` 스크립트를 실행하여 초기 미션 카탈로그 데이터를 추가할 수 있습니다.

2. **테스트**: `test_db.py`를 실행하여 데이터베이스 연결을 테스트할 수 있습니다.

3. **로깅**: 개발 중에는 SQL 쿼리를 확인하기 위해 `echo=True`가 설정되어 있습니다. 프로덕션에서는 `False`로 변경하세요.
