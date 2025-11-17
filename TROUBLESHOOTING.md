# 카카오 로그인 문제 해결 가이드

## 🔍 현재 상황 체크리스트

### 1. 어떤 문제인가요?

- [ ] 카카오 로그인 버튼을 눌렀는데 반응이 없다
- [ ] 카카오 로그인 페이지로는 가지만 다시 돌아오지 않는다
- [ ] 로그인은 되는데 홈 화면으로 안 간다
- [ ] 에러 메시지가 나온다 (어떤 에러인지 알려주세요)
- [ ] http://127.0.0.1:8000 에 접속이 안 된다
- [ ] http://localhost:5173 (프론트엔드)에 접속이 안 된다

---

## 🔧 단계별 확인

### STEP 1: 백엔드 서버 확인

**브라우저에서 접속해보기:**
```
http://127.0.0.1:8000
```

#### ✅ 성공 (JSON이 보임):
```json
{
  "message": "Zero Waste Routine API",
  "version": "1.0.0",
  "docs": "/docs"
}
```
→ 백엔드 정상! STEP 2로 이동

#### ❌ 실패 (페이지를 찾을 수 없음):
- 백엔드 터미널에서 서버가 실행 중인지 확인
- `INFO: Application startup complete.` 메시지가 보이는지 확인
- 터미널이 닫혔다면 다시 시작:
```cmd
cd backend
venv\Scripts\activate
python -m uvicorn main:app --reload
```

---

### STEP 2: 프론트엔드 서버 확인

**브라우저에서 접속해보기:**
```
http://localhost:5173
```

#### ✅ 성공 (로그인 페이지가 보임):
→ 프론트엔드 정상! STEP 3으로 이동

#### ❌ 실패 (페이지를 찾을 수 없음):
- 프론트엔드 터미널에서 서버가 실행 중인지 확인
- 터미널이 닫혔다면 다시 시작:
```cmd
npm run dev
```

---

### STEP 3: 환경 변수 확인

#### 백엔드 `.env` 파일 (`backend/.env`):
```env
KAKAO_CLIENT_ID=your-rest-api-key-here
KAKAO_REDIRECT_URI=http://localhost:5173
```

- `KAKAO_CLIENT_ID`에 실제 REST API 키가 있는지 확인
- `your-rest-api-key-here`가 아닌 실제 키여야 함

#### 프론트엔드 `.env` 파일 (프로젝트 루트 `.env`):
```env
VITE_KAKAO_CLIENT_ID=your-rest-api-key-here
VITE_KAKAO_REDIRECT_URI=http://localhost:5173
```

- `VITE_` 접두사가 있어야 함
- 백엔드와 동일한 REST API 키 사용

**환경 변수 변경 후 반드시 서버 재시작!**

---

### STEP 4: 카카오 개발자 콘솔 확인

https://developers.kakao.com 접속

1. **내 애플리케이션** 선택
2. **앱 키** > **REST API 키** 복사 → `.env` 파일과 일치하는지 확인
3. **카카오 로그인** 메뉴:
   - 활성화 상태가 **ON**인지 확인
   - **Redirect URI**에 `http://localhost:5173` 등록되었는지 확인
4. **동의 항목**:
   - 닉네임, 프로필 이미지, 카카오계정(이메일) 설정 확인

---

### STEP 5: 브라우저 개발자 도구 확인

**F12** 또는 **우클릭 > 검사**

#### Console 탭:
- 빨간색 에러 메시지가 있나요?
- `[App] 카카오 인가 코드 감지` 메시지 다음에 뭐가 나오나요?
  - ✅ `[App] 카카오 로그인 성공` → 성공했지만 화면이 안 넘어감
  - ❌ `[App] 카카오 로그인 실패: ...` → 에러 메시지 확인

#### Network 탭:
1. **Name** 열에서 `callback` 찾기
2. 클릭해서 확인:
   - **Status**: 200 (성공) / 400, 500 (실패)
   - **Response**: 에러 메시지 확인

#### Application 탭:
1. 좌측 **Local Storage** > `http://localhost:5173` 클릭
2. `access`와 `refresh` 키가 있나요?
   - ✅ 있음 → 로그인 성공했지만 화면 전환 문제
   - ❌ 없음 → 로그인 실패

---

## 🚨 자주 발생하는 문제

### 문제 1: "카카오 클라이언트 ID가 설정되지 않았습니다"
**원인**: `.env` 파일에 `KAKAO_CLIENT_ID` 없음 또는 잘못됨

**해결**:
1. `backend/.env` 파일 열기
2. 다음 추가:
```env
KAKAO_CLIENT_ID=실제-REST-API-키
KAKAO_REDIRECT_URI=http://localhost:5173
```
3. 백엔드 서버 재시작 (Ctrl+C 후 다시 실행)

---

### 문제 2: "Redirect URI mismatch"
**원인**: 카카오 개발자 콘솔에 Redirect URI 미등록

**해결**:
1. https://developers.kakao.com 접속
2. 카카오 로그인 > Redirect URI 등록
3. `http://localhost:5173` 정확히 입력 (끝에 `/` 없이)

---

### 문제 3: CORS 에러
**원인**: 백엔드와 프론트엔드 통신 문제

**해결**:
`backend/.env` 확인:
```env
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

### 문제 4: 로그인은 되는데 홈으로 안 감
**원인**: 상태 업데이트 문제 (이미 수정됨)

**임시 해결**: 브라우저 수동 새로고침 (F5)

**근본 해결**: 이미 `src/App.tsx`에서 `window.location.href = "/"`로 수정됨

---

## 📋 최종 체크리스트

실행 전 확인:
- [ ] 백엔드 서버 실행 중 (http://127.0.0.1:8000 접속 가능)
- [ ] 프론트엔드 서버 실행 중 (http://localhost:5173 접속 가능)
- [ ] `backend/.env`에 `KAKAO_CLIENT_ID` 설정됨
- [ ] `.env`에 `VITE_KAKAO_CLIENT_ID` 설정됨
- [ ] 카카오 개발자 콘솔에 Redirect URI 등록됨
- [ ] httpx 패키지 설치됨 (`pip install httpx`)
- [ ] 환경 변수 변경 후 서버 재시작함

---

## 🆘 그래도 안 되면

다음 정보를 알려주세요:

1. **브라우저 콘솔 (F12 > Console)의 에러 메시지 전체**
2. **백엔드 터미널의 에러 메시지 전체**
3. **어느 단계에서 막히는지:**
   - 카카오 로그인 버튼 클릭 → 반응 없음?
   - 카카오 로그인 페이지 → 로그인 완료 → 앱으로 돌아오지 않음?
   - 앱으로 돌아옴 → 로그인 페이지 그대로?
   - 에러 메시지가 뜸?

---

## 🔄 완전 초기화 방법 (최후의 수단)

모든 캐시 및 스토리지 삭제:

1. **브라우저**: F12 > Application > Clear storage > "Clear site data" 클릭
2. **브라우저 재시작**
3. **백엔드 재시작**: Ctrl+C 후 다시 실행
4. **프론트엔드 재시작**: Ctrl+C 후 `npm run dev`
5. 다시 로그인 시도

