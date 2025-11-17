# 로그인 디버깅 가이드

## 🔍 로그인 후 홈으로 이동하지 않는 문제 해결

### 1️⃣ 브라우저 콘솔 확인

**F12** 또는 **우클릭 > 검사**를 눌러 개발자 도구를 열고:

1. **Console 탭** 확인:
   - 에러 메시지가 있는지 확인
   - `[App] 카카오 로그인 성공` 메시지가 보이는지 확인
   - 빨간색 에러가 있으면 내용 확인

2. **Network 탭** 확인:
   - `/api/auth/kakao/callback` 요청 찾기
   - Status가 200 (성공)인지 확인
   - Response에 `access`와 `refresh` 토큰이 있는지 확인

3. **Application 탭** 확인:
   - 좌측 메뉴 > **Local Storage** > `http://localhost:5173` 클릭
   - `access`와 `refresh` 키가 있는지 확인
   - 값이 비어있지 않은지 확인

---

## 🛠️ 문제별 해결 방법

### 문제 1: "카카오 로그인 실패" 에러
**원인**: 백엔드에서 카카오 API 호출 실패

**해결**:
1. 백엔드 `.env`에 `KAKAO_CLIENT_ID`가 올바른지 확인
2. 카카오 개발자 콘솔에서 REST API 키 다시 복사
3. 백엔드 서버 재시작 (`Ctrl+C` 후 다시 실행)

---

### 문제 2: "CORS" 에러
**원인**: 백엔드와 프론트엔드 통신 문제

**해결**:
백엔드 `.env` 파일에서 CORS 설정 확인:
```env
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

### 문제 3: 토큰은 받았는데 홈으로 안 감
**원인**: `isAuthed` 상태가 업데이트되지 않음

**임시 해결** (페이지 새로고침):
- 로그인 후 **F5** 또는 **새로고침** 버튼 클릭

**근본 해결**:
`src/App.tsx` 수정 필요 (아래 코드 참고)

---

## 🔧 긴급 수정: 카카오 로그인 후 자동 새로고침

카카오 로그인 성공 후 페이지를 새로고침하도록 수정:

**src/App.tsx (줄 531 근처)**:
```typescript
console.log("[App] 카카오 로그인 성공");
setIsAuthed(true);

// URL에서 code 파라미터 제거
window.history.replaceState({}, document.title, "/");

// 👇 이 줄 추가
window.location.reload();
```

또는 더 나은 방법:
```typescript
console.log("[App] 카카오 로그인 성공");
localStorage.setItem("access", data.access);
localStorage.setItem("refresh", data.refresh);

// URL에서 code 파라미터 제거하고 즉시 리다이렉트
window.location.href = "/";
```

---

## 📋 체크리스트

- [ ] 백엔드 서버가 실행 중인가? (http://localhost:8000)
- [ ] 프론트엔드 서버가 실행 중인가? (http://localhost:5173)
- [ ] 백엔드 `.env`에 `KAKAO_CLIENT_ID` 설정됨?
- [ ] 프론트엔드 `.env`에 `VITE_KAKAO_CLIENT_ID` 설정됨?
- [ ] 카카오 개발자 콘솔에 Redirect URI (`http://localhost:5173`) 등록됨?
- [ ] 환경 변수 변경 후 서버 재시작했는가?
- [ ] 브라우저 콘솔에 에러 없는가?
- [ ] localStorage에 토큰이 저장되었는가?

---

## 🚀 빠른 테스트

브라우저 콘솔(F12)에서 다음 명령어 입력:
```javascript
console.log("Access Token:", localStorage.getItem("access"));
console.log("Refresh Token:", localStorage.getItem("refresh"));
```

토큰이 있으면 로그인이 성공한 것이고, 없으면 실패한 것입니다.

---

어떤 에러가 나오는지 알려주시면 더 정확히 도와드릴 수 있습니다! 😊

