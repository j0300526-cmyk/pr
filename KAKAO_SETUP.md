# 카카오 소셜 로그인 설정 가이드

## 1️⃣ 카카오 개발자 콘솔 설정

### 앱 생성 및 기본 설정
1. **카카오 개발자 콘솔** 접속: https://developers.kakao.com
2. **내 애플리케이션** > **애플리케이션 추가하기** 클릭
3. 앱 이름 입력 후 생성
4. **앱 키** 메뉴에서 **REST API 키** 복사 (나중에 `.env` 파일에 사용)

### 카카오 로그인 활성화
1. 좌측 메뉴에서 **카카오 로그인** 선택
2. **활성화 설정**을 **ON**으로 변경
3. **Redirect URI** 등록:
   - `http://localhost:5173` (개발용)
   - `http://127.0.0.1:5173` (개발용 대체)
   - 배포 시: `https://your-domain.com` 추가

### 동의 항목 설정
1. **카카오 로그인** > **동의 항목** 메뉴 선택
2. 다음 항목을 **선택 동의**로 설정:
   - **닉네임** (profile_nickname)
   - **프로필 이미지** (profile_image)
   - **카카오계정(이메일)** (account_email)

---

## 2️⃣ 백엔드 설정

### 환경 변수 설정
`backend/.env` 파일에 다음 내용 추가:

```env
# 카카오 소셜 로그인 설정
KAKAO_CLIENT_ID=your-kakao-rest-api-key-here
KAKAO_REDIRECT_URI=http://localhost:5173
```

**`KAKAO_CLIENT_ID`**: 카카오 개발자 콘솔에서 복사한 **REST API 키** 붙여넣기

### 패키지 설치
```bash
cd backend
pip install httpx
```

또는 `requirements.txt`에 이미 추가되어 있으므로:
```bash
pip install -r requirements.txt
```

### 데이터베이스 마이그레이션
`User` 모델에 `kakao_id` 필드가 추가되었습니다. 기존 데이터베이스를 사용 중이라면:

**Option A: SQLite 파일 삭제 (개발 환경)**
```bash
# 기존 데이터 삭제 후 새로 생성
rm backend/zero_waste.db
python backend/main.py
```

**Option B: Alembic으로 마이그레이션 (프로덕션 환경)**
```bash
cd backend
alembic revision --autogenerate -m "Add kakao_id to users"
alembic upgrade head
```

### 백엔드 서버 재시작
```bash
cd backend
python -m uvicorn main:app --reload
```

---

## 3️⃣ 프론트엔드 설정

### 환경 변수 설정
프로젝트 루트에 `.env` 파일 생성 (또는 수정):

```env
# 카카오 소셜 로그인 설정
VITE_KAKAO_CLIENT_ID=your-kakao-rest-api-key-here
VITE_KAKAO_REDIRECT_URI=http://localhost:5173
```

**주의**: Vite 환경 변수는 반드시 `VITE_` 접두사로 시작해야 합니다.

### 프론트엔드 서버 재시작
```bash
npm run dev
```

---

## 4️⃣ 테스트

1. **로그인 페이지 접속**: http://localhost:5173
2. **카카오 로그인 버튼** 클릭
3. 카카오 로그인 페이지로 리다이렉트 확인
4. 카카오 계정으로 로그인
5. 앱으로 돌아와서 자동 로그인 확인

---

## 🔍 트러블슈팅

### 1. "카카오 클라이언트 ID가 설정되지 않았습니다" 에러
- `.env` 파일에 `VITE_KAKAO_CLIENT_ID`가 올바르게 설정되었는지 확인
- Vite 서버를 재시작했는지 확인 (환경 변수 변경 시 재시작 필수)

### 2. "Redirect URI mismatch" 에러
- 카카오 개발자 콘솔의 **Redirect URI**가 정확히 `http://localhost:5173`인지 확인
- 프로토콜(http/https), 포트 번호까지 정확히 일치해야 함

### 3. 백엔드 500 에러
- 백엔드 콘솔 로그 확인
- `backend/.env`에 `KAKAO_CLIENT_ID`가 올바르게 설정되었는지 확인
- `httpx` 패키지가 설치되었는지 확인: `pip list | grep httpx`

### 4. CORS 에러
- `backend/main.py`의 `CORS_ORIGINS`에 `http://localhost:5173`이 포함되어 있는지 확인
- 백엔드 서버가 실행 중인지 확인

---

## 📁 주요 파일 변경 사항

### 백엔드
- `backend/models.py`: `User` 모델에 `kakao_id` 필드 추가
- `backend/routers/kakao_auth.py`: 카카오 OAuth 콜백 처리 라우터 (신규)
- `backend/main.py`: `kakao_auth` 라우터 등록
- `backend/requirements.txt`: `httpx` 패키지 추가

### 프론트엔드
- `src/pages/Login.tsx`: 카카오 로그인 버튼 클릭 시 카카오 OAuth 페이지로 리다이렉트
- `src/App.tsx`: URL 파라미터에서 카카오 인가 코드 감지 및 백엔드로 전송, JWT 토큰 저장

---

## 🎉 완료!

이제 카카오 소셜 로그인이 정상적으로 작동합니다.
사용자는 카카오 계정으로 간편하게 로그인할 수 있습니다.

