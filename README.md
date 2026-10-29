# Zero Waste Routine

개인 실천 미션과 그룹 챌린지를 함께 관리하는 제로웨이스트 루틴 앱입니다. React/Vite 프런트엔드와 FastAPI 백엔드로 구성되어 있습니다.

## 주요 기능

- 일별 미션 조회·추가·완료 처리 및 주간 루틴 관리
- 그룹 미션 생성, 참여, 초대 및 완료 체크
- 친구 추천과 초대 수락·거절
- 로그인 없이 바로 사용하는 공용 게스트 데모
- 개인 및 그룹 랭킹

## 기술 구성

| 영역 | 기술 |
| --- | --- |
| 프런트엔드 | React 18, TypeScript, Vite, Tailwind CSS |
| 백엔드 | Python, FastAPI, SQLAlchemy, Pydantic |
| 데이터베이스 | SQLite(로컬·무료 데모) 또는 PostgreSQL(영구 저장) |
| 접근 방식 | 로그인 없는 공용 게스트 모드 |

## 빠른 시작

### 1. 저장소 받기

```bash
git clone https://github.com/j0300526-cmyk/pr.git
cd pr
```

### 2. 백엔드 실행

Python 3.11 이상을 권장합니다.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

`backend/.env` 파일을 만들고 로컬 설정을 추가합니다.

```bash
cp .env.example .env
```

```env
DATABASE_URL=sqlite:///./zero_waste.db
CORS_ORIGINS=http://localhost:5173
```

처음 실행하는 경우 샘플 미션·사용자·그룹을 생성합니다.

```bash
python init_data.py
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

별도 로그인 없이 공용 게스트 계정으로 바로 사용할 수 있습니다.

API 문서는 서버 실행 후 [http://localhost:8000/docs](http://localhost:8000/docs)에서 볼 수 있습니다.

### 3. 프런트엔드 실행

새 터미널에서 프로젝트 루트로 돌아와 실행합니다.

```bash
npm ci
npm run dev
```

기본 주소는 [http://localhost:5173](http://localhost:5173)입니다. 개발 서버는 `/api` 요청을 `http://localhost:8000`으로 프록시합니다.

백엔드 주소를 직접 지정해야 하면 프로젝트 루트에 `.env.local` 파일을 만듭니다.

```bash
cp .env.example .env.local
```

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 테스트와 빌드

프로젝트 루트에서 실행합니다.

```bash
# 백엔드 테스트 도구 설치
source backend/.venv/bin/activate
pip install -r backend/requirements-dev.txt

# API 테스트
pytest

# 프런트엔드 프로덕션 빌드
npm run build
```

테스트는 별도 SQLite 데이터베이스를 사용하려면 다음처럼 실행할 수 있습니다.

```bash
DATABASE_URL=sqlite:////tmp/zero-waste-test.sqlite pytest
```

## 환경 변수

| 변수 | 용도 | 필수 여부 |
| --- | --- | --- |
| `DATABASE_URL` | SQLite 또는 PostgreSQL 연결 문자열. 생략 시 로컬 SQLite 사용 | 아니요 |
| `CORS_ORIGINS` | 쉼표로 구분한 허용 프런트엔드 주소 | 배포 시 예 |
| `VITE_API_BASE_URL` | 프런트엔드 API 주소 | 아니요 |

DB 비밀번호 같은 비밀값은 커밋하지 마세요. `.env`와 `.env.local`은 이미 Git에서 제외됩니다.

## 프로젝트 구조

```text
.
├── src/                    # React 프런트엔드
│   ├── api/                # API 클라이언트
│   ├── components/         # UI 컴포넌트
│   └── pages/              # 화면
├── backend/
│   ├── routers/            # FastAPI 라우터
│   ├── tests/              # API 테스트
│   ├── models.py           # SQLAlchemy 모델
│   └── main.py             # FastAPI 앱 진입점
├── pytest.ini              # 테스트 수집 설정
└── package.json
```

## 배포

`vercel.json`은 Vite 프런트엔드와 FastAPI 백엔드를 하나의 Vercel 프로젝트로 배포합니다. 환경변수 없이도 Hobby 플랜에서 공용 데모로 실행되며, Vercel에서는 `/tmp`의 임시 SQLite를 사용하므로 새 함수 인스턴스가 생성되면 데이터가 초기화될 수 있습니다. 영구 저장이 필요하면 무료 PostgreSQL 서비스의 `DATABASE_URL`을 Vercel 환경변수로 연결하세요.
