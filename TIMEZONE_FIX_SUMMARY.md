# KST(한국 시간) 타임존 수정 요약

## 📋 개요
UTC 기준으로 처리되던 날짜 계산을 모두 KST(Asia/Seoul, UTC+9)로 통일하여 
"오늘 날짜에만 미션 추가 가능" 기능이 정확히 동작하도록 수정했습니다.

---

## ✅ 백엔드(FastAPI) 수정사항

### 1️⃣ `backend/routers/day_missions.py`
**수정 전:**
```python
from datetime import date, datetime
from zoneinfo import ZoneInfo
TIMEZONE_NAME = os.getenv("APP_TIMEZONE", "Asia/Seoul")
try:
    LOCAL_TZ = ZoneInfo(TIMEZONE_NAME)
except Exception:
    LOCAL_TZ = ZoneInfo("UTC")

# 미션 추가 API에서
today = datetime.now(LOCAL_TZ).date()
```

**수정 후:**
```python
from datetime import date, datetime
from zoneinfo import ZoneInfo
import json
import os

# KST(Asia/Seoul) 타임존 설정
KST = ZoneInfo("Asia/Seoul")

# 미션 추가 API에서
today = datetime.now(KST).date()
```

**변경 내용:**
- 타임존을 명시적으로 `KST = ZoneInfo("Asia/Seoul")`로 고정
- `LOCAL_TZ` 변수 제거로 일관성 확보
- 모든 날짜 계산이 KST 기준으로 통일됨

---

### 2️⃣ `backend/auth.py`
**수정 전:**
```python
from datetime import datetime, timedelta
# ...
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta  # ❌ UTC 기준
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    # ...

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)  # ❌ UTC 기준
    to_encode.update({"exp": expire, "type": "refresh"})
    # ...
```

**수정 후:**
```python
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

# KST(Asia/Seoul) 타임존
KST = ZoneInfo("Asia/Seoul")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(KST) + expires_delta  # ✅ KST 기준
    else:
        expire = datetime.now(KST) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    # ...

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(KST) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)  # ✅ KST 기준
    to_encode.update({"exp": expire, "type": "refresh"})
    # ...
```

**변경 내용:**
- JWT 토큰 만료 시간을 KST 기준으로 계산
- `datetime.utcnow()` → `datetime.now(KST)` 변경

---

### 3️⃣ `backend/seed_groups_sqlite.py`
**수정 전:**
```python
from datetime import datetime

# ...
cur.execute(
    "INSERT INTO users (...) VALUES (...)",
    ("test@example.com", "", "테스트 사용자", ..., datetime.utcnow().isoformat()),  # ❌ UTC
)
```

**수정 후:**
```python
from datetime import datetime
from zoneinfo import ZoneInfo

KST = ZoneInfo("Asia/Seoul")

# ...
cur.execute(
    "INSERT INTO users (...) VALUES (...)",
    ("test@example.com", "", "테스트 사용자", ..., datetime.now(KST).isoformat()),  # ✅ KST
)
```

---

## ✅ 프론트엔드(React/TypeScript) 수정사항

### 1️⃣ `src/utils/date.ts`
**수정 전:**
```typescript
export const isToday = (iso: string | null): boolean => {
  if (!iso) return false;
  const target = new Date(iso);
  return isSameDay(target, new Date());  // ❌ 브라우저 로컬 시간 (UTC 환경에서 9시간 차이)
};

export const generateWeekDays = (center = new Date()): WeekDay[] => {
  const today = withMidnight(center);  // ❌ 브라우저 로컬 시간
  // ...
  const todayISO = formatLocalDate(today);
  // ...
};
```

**수정 후:**
```typescript
// KST(UTC+9) 기준 오늘 날짜를 YYYY-MM-DD 형식으로 반환
export const getTodayKST = (): string => {
  const kstTime = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kstTime.toISOString().slice(0, 10);
};

export const isToday = (iso: string | null): boolean => {
  if (!iso) return false;
  return iso === getTodayKST();  // ✅ KST 기준 비교
};

export const generateWeekDays = (center = new Date()): WeekDay[] => {
  const today = withMidnight(center);
  // ...
  const todayISO = getTodayKST();  // ✅ KST 기준 오늘 날짜 사용
  // ...
};
```

**변경 내용:**
- `getTodayKST()` 함수 추가: UTC+9시간 보정으로 KST 오늘 날짜 계산
- `isToday()` 함수 단순화: 문자열 직접 비교로 타임존 문제 완전 해결
- `generateWeekDays()` 함수에서 KST 오늘 날짜 사용

---

### 2️⃣ `src/utils/missions.ts`
**수정 전:**
```typescript
import { MissionsRecord, Mission } from "../types";

export const calculateStreak = (missions: MissionsRecord): number => {
  // ...
  let streak = 0;
  const today = new Date();  // ❌ 브라우저 로컬 시간
  today.setHours(0, 0, 0, 0);

  while (true) {
    const check = new Date(today);
    check.setDate(today.getDate() - streak);
    const key = check.toISOString().split("T")[0];  // ❌ UTC 기준 ISO 문자열
    // ...
  }
};
```

**수정 후:**
```typescript
import { MissionsRecord, Mission } from "../types";
import { getTodayKST } from "./date";

export const calculateStreak = (missions: MissionsRecord): number => {
  // ...
  let streak = 0;
  const todayISO = getTodayKST();  // ✅ KST 기준 오늘 날짜
  const today = new Date(todayISO + "T00:00:00");

  while (true) {
    const check = new Date(today);
    check.setDate(today.getDate() - streak);
    const year = check.getFullYear();
    const month = String(check.getMonth() + 1).padStart(2, "0");
    const day = String(check.getDate()).padStart(2, "0");
    const key = `${year}-${month}-${day}`;  // ✅ 명시적 로컬 날짜 포맷
    // ...
  }
};
```

**변경 내용:**
- `getTodayKST()` 함수 import하여 KST 기준 오늘 날짜 사용
- `toISOString()` 대신 명시적 로컬 날짜 포맷 사용 (타임존 문제 완전 해결)

---

### 3️⃣ `src/App.tsx`
**수정 전:**
```typescript
import {
  generateWeekDays as createWeekDays,
  isToday as isTodayDate,
  formatDateLabel,
} from "./utils/date";

// ...
const initializeWeekDays = async (serverDate?: string) => {
  const centerDate = serverDate ? new Date(serverDate) : new Date();  // ❌ 브라우저 로컬 시간
  const days = createWeekDays(centerDate);
  // ...
};
```

**수정 후:**
```typescript
import {
  generateWeekDays as createWeekDays,
  isToday as isTodayDate,
  formatDateLabel,
  getTodayKST,
} from "./utils/date";

// ...
const initializeWeekDays = async (serverDate?: string) => {
  const centerDate = serverDate ? new Date(serverDate) : new Date(getTodayKST());  // ✅ KST 기준
  const days = createWeekDays(centerDate);
  // ...
};
```

**변경 내용:**
- `getTodayKST()` import 추가
- 기본 날짜 계산을 KST 기준으로 변경

---

### 4️⃣ `src/api/api.ts` - Mock API
**수정 전:**
```typescript
"/server/date": () => new Date().toISOString().split("T")[0],  // ❌ UTC 기준
```

**수정 후:**
```typescript
"/server/date": () => {
  // KST(UTC+9) 기준 오늘 날짜
  const kstTime = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kstTime.toISOString().slice(0, 10);  // ✅ KST 기준
},
```

---

## 🔄 전체 흐름

### 수정 전 문제 상황
```
서버(UTC) ---> 클라이언트(UTC) ----> 어플리케이션
  08:00                 08:00        [인식되는 날짜: 2024-01-15]
  
한국시간(KST)는 2024-01-15 17:00인데
어플리케이션에서는 2024-01-15로 처리됨
❌ 오늘 날짜 판정 오류: 미션 추가 불가
```

### 수정 후 정상 동작
```
서버(KST) -----> 클라이언트(KST) ----> 어플리케이션
  17:00 (KST)       17:00 (KST)      [인식되는 날짜: 2024-01-15]
  
한국시간(KST) 2024-01-15 17:00
어플리케이션에서도 2024-01-15로 일관되게 처리됨
✅ 오늘 날짜 판정 정확: 미션 추가 정상 작동
```

---

## 🧪 테스트 체크리스트

- [ ] 로그인 후 홈 페이지 로드 시 오늘 날짜가 올바르게 표시되는지 확인
- [ ] 캘린더에서 오늘 날짜에 체크 표시가 있는지 확인
- [ ] 오늘 날짜일 때만 "미션 추가" 버튼이 활성화되는지 확인
- [ ] 과거/미래 날짜일 때 "미션 추가" 버튼이 비활성화되는지 확인
- [ ] 미션 추가 후 저장되는지 확인
- [ ] 연속 달성(Streak) 계산이 올바르게 되는지 확인
- [ ] JWT 토큰 만료 시간이 KST 기준으로 계산되는지 확인 (개발자 도구 > Application > Cookies)

---

## 📝 기술 상세 설명

### UTC vs KST 문제
- **UTC (협정 세계시)**: 전 세계 표준 시간
- **KST (한국 표준시)**: UTC+9 (한국 현지 시간)
- JavaScript의 `new Date()`: 브라우저의 로컬 시간존 사용
- `toISOString()`: 항상 UTC 기준의 ISO 8601 문자열 반환

### 예시
```javascript
// UTC 환경에서 2024-01-15 08:00 UTC
new Date().toISOString()  // "2024-01-15T08:00:00.000Z"
// 한국시간으로는 2024-01-15 17:00 KST인데
// ISO 문자열은 2024-01-15 08:00로 표시됨

// 수정된 방식
const kstTime = new Date(Date.now() + 9 * 60 * 60 * 1000);
kstTime.toISOString().slice(0, 10)  // "2024-01-15"
// KST 2024-01-15 17:00 -> 계산 후 ISO 문자열의 첫 10글자만 추출
```

---

## 🚀 배포 시 주의사항

1. **서버 타임존 설정**: 운영 환경에서도 `/etc/timezone`이 `Asia/Seoul`로 설정되어 있는지 확인
2. **데이터베이스**: 타임존 설정이 일관되게 유지되는지 확인
3. **환경 변수**: 필요시 `APP_TIMEZONE=Asia/Seoul`로 명시

---

## 🔗 관련 파일 목록

### 백엔드
- `backend/routers/day_missions.py` ✅
- `backend/auth.py` ✅
- `backend/seed_groups_sqlite.py` ✅

### 프론트엔드
- `src/utils/date.ts` ✅
- `src/utils/missions.ts` ✅
- `src/App.tsx` ✅
- `src/api/api.ts` ✅

---

## 📚 참고 문서
- Python `zoneinfo` 모듈: https://docs.python.org/3/library/zoneinfo.html
- JavaScript Date 타임존: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date

