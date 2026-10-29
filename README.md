# Zero Waste Routine

개인 실천 미션과 그룹 챌린지를 함께 관리하는 제로웨이스트 루틴 앱입니다. React/Vite 프런트엔드와 FastAPI 백엔드로 구성되어 있습니다.

## 주요 기능

- 일별 미션 조회·추가·완료 처리 및 주간 루틴 관리
- 그룹 미션 생성, 참여, 초대 및 완료 체크
- 친구 추천과 초대 수락·거절
- 이메일/비밀번호 로그인과 카카오 로그인
- 개인 및 그룹 랭킹

## 기술 구성

| 영역 | 기술 |
| --- | --- |
| 프런트엔드 | React 18, TypeScript, Vite, Tailwind CSS |
| 백엔드 | Python, FastAPI, SQLAlchemy, Pydantic |
| 데이터베이스 | SQLite(로컬) 또는 PostgreSQL(배포) |
| 인증 | JWT, 카카오 OAuth |

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
JWT_SECRET_KEY=change-this-to-a-long-random-value
JWT_ALGORITHM=HS256
CORS_ORIGINS=http://localhost:5173
```

처음 실행하는 경우 샘플 미션·사용자·그룹을 생성합니다.

```bash
python init_data.py
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

샘플 계정은 `test@example.com` / `test1234`입니다. 개발 용도로만 사용하고, 배포 환경에서는 반드시 제거하거나 별도 계정을 사용하세요.

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
# 개발 서버에서는 샘플 계정으로 자동 로그인됩니다. 필요 시 false로 끌 수 있습니다.
VITE_AUTO_LOGIN=true
# 기본값: test@example.com / test1234
# VITE_DEMO_EMAIL=test@example.com
# VITE_DEMO_PASSWORD=test1234
```

자동 로그인은 개발 모드에서만 작동하며, 로그아웃을 누르면 해당 브라우저 탭에서는 다시 자동 로그인하지 않습니다.

## 카카오 로그인 설정

카카오 로그인을 사용하려면 다음 변수를 설정하세요.

```env
# backend/.env
KAKAO_CLIENT_ID=your-kakao-rest-api-key
KAKAO_REDIRECT_URI=http://localhost:5173/auth/kakao/callback

# .env.local
VITE_KAKAO_CLIENT_ID=your-kakao-rest-api-key
VITE_KAKAO_REDIRECT_URI=http://localhost:5173/auth/kakao/callback
```

카카오 개발자 콘솔에도 동일한 리디렉션 URI를 등록해야 합니다. Google·네이버 로그인 버튼은 현재 연결되어 있지 않습니다.

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
| `DATABASE_URL` | SQLite 또는 PostgreSQL 연결 문자열 | 예 |
| `JWT_SECRET_KEY` | JWT 서명 키. 운영 환경에서는 필수 | 예 |
| `JWT_ALGORITHM` | JWT 알고리즘. 기본값은 `HS256` | 아니요 |
| `CORS_ORIGINS` | 쉼표로 구분한 허용 프런트엔드 주소 | 배포 시 예 |
| `KAKAO_CLIENT_ID` | 카카오 REST API 키 | 카카오 로그인 사용 시 |
| `KAKAO_REDIRECT_URI` | 카카오 OAuth 콜백 주소 | 카카오 로그인 사용 시 |
| `VITE_API_BASE_URL` | 프런트엔드 API 주소 | 아니요 |
| `VITE_AUTO_LOGIN` | 개발 모드의 샘플 계정 자동 로그인 (`false`로 비활성화) | 아니요 |
| `VITE_DEMO_EMAIL` | 자동 로그인에 사용할 개발용 이메일 | 아니요 |
| `VITE_DEMO_PASSWORD` | 자동 로그인에 사용할 개발용 비밀번호 | 아니요 |
| `VITE_KAKAO_CLIENT_ID` | 프런트엔드 카카오 앱 키 | 카카오 로그인 사용 시 |
| `VITE_KAKAO_REDIRECT_URI` | 프런트엔드 카카오 콜백 주소 | 카카오 로그인 사용 시 |

`JWT_SECRET_KEY`, DB 비밀번호, OAuth 키는 커밋하지 마세요. `.env`와 `.env.local`은 이미 Git에서 제외됩니다.

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

Render 배포 설정은 [`render.yaml`](./render.yaml)에 포함되어 있습니다. NCP 배포 절차는 [`NCP_DEPLOY.md`](./NCP_DEPLOY.md)를 참고하세요. 배포 전에 `JWT_SECRET_KEY`, `DATABASE_URL`, `CORS_ORIGINS`, 카카오 OAuth 설정을 실제 환경 값으로 교체해야 합니다.
