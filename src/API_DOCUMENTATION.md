# API 문서

## 목차
1. [기본 정보](#기본-정보)
2. [인증](#인증)
3. [사용자](#사용자)
4. [미션 카탈로그](#미션-카탈로그)
5. [날짜별 미션](#날짜별-미션)
6. [그룹 미션](#그룹-미션)
7. [친구/초대](#친구초대)
8. [랭킹](#랭킹)
9. [유틸리티](#유틸리티)
10. [에러 코드](#에러-코드)

---

## 기본 정보

### Base URL
```
http://localhost:8000/api
```

환경 변수로 설정 가능:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### 인증 방식
대부분의 API는 JWT 토큰 기반 인증을 사용합니다.

**요청 헤더:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### 토큰 관리
- Access Token: API 요청 시 사용
- Refresh Token: Access Token 만료 시 갱신에 사용
- 토큰은 `localStorage`에 저장됩니다.

---

## 인증

### 1. 로그인

**POST** `/auth/login`

이메일과 비밀번호로 로그인합니다.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**에러:**
- `401`: 이메일 또는 비밀번호가 올바르지 않음
- `400`: 요청 데이터가 유효하지 않음

---

### 2. 소셜 로그인

**POST** `/auth/{provider}`

소셜 로그인을 통해 인증합니다. (카카오, 구글, 네이버)

**Path Parameters:**
- `provider`: `kakao` | `google` | `naver`

**Request Body:**
```json
{
  "code": "소셜_인증_코드"
}
```

**Response:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. 토큰 갱신

**POST** `/auth/refresh`

Access Token이 만료되었을 때 Refresh Token으로 새 토큰을 발급받습니다.

**Request Body:**
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 4. 로그아웃

**POST** `/auth/logout`

로그아웃합니다. 토큰을 무효화합니다.

**Response:**
```json
{
  "message": "로그아웃되었습니다"
}
```

---

## 사용자

### 1. 현재 사용자 정보 조회

**GET** `/users/me`

현재 로그인한 사용자의 정보를 조회합니다.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "id": 1,
  "name": "홍길동",
  "profile_color": "bg-green-300",
  "bio": "친환경 실천 중!",
  "email": "user@example.com"
}
```

---

### 2. 사용자 프로필 업데이트

**PUT** `/users/me`

사용자 프로필 정보를 업데이트합니다.

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "홍길동",
  "profile_color": "bg-blue-300",
  "bio": "새로운 소개글"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "홍길동",
  "profile_color": "bg-blue-300",
  "bio": "새로운 소개글",
  "email": "user@example.com"
}
```

---

## 미션 카탈로그

### 1. 사용 가능한 미션 목록 조회

**GET** `/missions/catalog`

시스템에 등록된 모든 미션 카탈로그를 조회합니다.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
[
  {
    "id": 101,
    "name": "텀블러 사용하기",
    "category": "일상",
    "icon": "tumbler-icon"
  },
  {
    "id": 102,
    "name": "리필스테이션 이용",
    "category": "일상",
    "icon": "refill-icon"
  },
  {
    "id": 103,
    "name": "대중교통 이용하기",
    "category": "모빌리티",
    "icon": "transport-icon"
  }
]
```

---

## 날짜별 미션

### 1. 특정 날짜의 미션 목록 조회

**GET** `/days/{date}/missions`

특정 날짜에 등록된 개인 미션 목록을 조회합니다.

**Path Parameters:**
- `date`: 날짜 (YYYY-MM-DD 형식, 예: `2024-11-15`)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
[
  {
    "id": 1,
    "mission": {
      "id": 101,
      "name": "텀블러 사용하기",
      "category": "일상"
    },
    "completed": false,
    "created_at": "2024-11-15T09:00:00Z"
  },
  {
    "id": 2,
    "mission": {
      "id": 102,
      "name": "리필스테이션 이용",
      "category": "일상"
    },
    "completed": true,
    "created_at": "2024-11-15T09:05:00Z"
  }
]
```

---

### 2. 미션 추가

**POST** `/days/{date}/missions`

특정 날짜에 개인 미션을 추가합니다. 오늘 날짜에만 추가 가능합니다.

**Path Parameters:**
- `date`: 날짜 (YYYY-MM-DD 형식)

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "mission_id": 101,
  "submission": "텀블러 사용하기"
}
```

**Response:**
```json
{
  "id": 3,
  "mission": {
    "id": 101,
    "name": "텀블러 사용하기",
    "category": "일상"
  },
  "sub_mission": "텀블러 사용하기",
  "completed": false,
  "created_at": "2024-11-15T10:00:00Z"
}
```

**에러:**
- `400`: 오늘이 아닌 날짜에는 추가할 수 없음
- `400`: 이미 추가된 소주제
- `404`: 존재하지 않는 미션 ID

---

### 3. 미션 삭제

**DELETE** `/days/{date}/missions/{day_mission_id}`

특정 날짜의 미션을 삭제합니다.

**Path Parameters:**
- `date`: 날짜 (YYYY-MM-DD 형식)
- `day_mission_id`: 날짜별 미션 ID (dayMissionPk)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "message": "미션이 삭제되었습니다"
}
```

**에러:**
- `404`: 존재하지 않는 미션
- `403`: 본인의 미션이 아님

---

### 4. 미션 완료 상태 토글

**PATCH** `/days/{date}/missions/{day_mission_id}/complete`

미션의 완료 상태를 변경합니다.

**Path Parameters:**
- `date`: 날짜 (YYYY-MM-DD 형식)
- `day_mission_id`: 날짜별 미션 ID

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "completed": true
}
```

**Response:**
```json
{
  "id": 1,
  "mission": {
    "id": 101,
    "name": "텀블러 사용하기",
    "category": "일상"
  },
  "completed": true,
  "created_at": "2024-11-15T09:00:00Z"
}
```

---

## 그룹 미션

### 1. 내가 참여 중인 그룹 미션 목록

**GET** `/group-missions/my`

현재 사용자가 참여 중인 그룹 미션 목록을 조회합니다.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "일회용 컵 사용 안하기",
    "participants": ["홍길동", "김철수", "이영희"],
    "color": "bg-blue-300",
    "total_score": 150,
    "member_count": 3
  },
  {
    "id": 2,
    "name": "장바구니 들고 쇼핑하기",
    "participants": ["홍길동", "박민수"],
    "color": "bg-purple-300",
    "total_score": 120,
    "member_count": 2
  }
]
```

---

### 2. 추천 그룹 미션 목록

**GET** `/group-missions/recommended`

참여 가능한 추천 그룹 미션 목록을 조회합니다.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
[
  {
    "id": 3,
    "name": "대중교통 이용하기",
    "participants": ["이준호", "박나영"],
    "color": "bg-green-400",
    "total_score": 200,
    "member_count": 2
  },
  {
    "id": 4,
    "name": "플라스틱 프리 챌린지",
    "participants": ["김수연", "한지우", "윤상민"],
    "color": "bg-purple-400",
    "total_score": 180,
    "member_count": 3
  }
]
```

---

### 3. 그룹 미션 상세 정보

**GET** `/group-missions/{group_id}`

특정 그룹 미션의 상세 정보를 조회합니다.

**Path Parameters:**
- `group_id`: 그룹 미션 ID

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "id": 1,
  "name": "일회용 컵 사용 안하기",
  "participants": ["홍길동", "김철수", "이영희"],
  "color": "bg-blue-300",
  "total_score": 150,
  "member_count": 3,
  "created_at": "2024-11-01T00:00:00Z",
  "description": "일회용 컵 대신 텀블러나 머그컵을 사용하는 미션입니다."
}
```

---

### 4. 그룹 미션 참여

**POST** `/group-missions/{group_id}/join`

그룹 미션에 참여합니다. 최대 3명까지 참여 가능합니다.

**Path Parameters:**
- `group_id`: 그룹 미션 ID

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "id": 1,
  "name": "일회용 컵 사용 안하기",
  "participants": ["홍길동", "김철수", "이영희", "새로운사용자"],
  "color": "bg-blue-300",
  "total_score": 150,
  "member_count": 4
}
```

**에러:**
- `400`: 이미 참여 중인 그룹
- `400`: 그룹 인원이 가득 참 (최대 3명)
- `404`: 존재하지 않는 그룹

---

### 5. 그룹 미션 나가기

**DELETE** `/group-missions/{group_id}/leave`

그룹 미션에서 나갑니다.

**Path Parameters:**
- `group_id`: 그룹 미션 ID

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "message": "그룹에서 나갔습니다"
}
```

**에러:**
- `404`: 참여하지 않은 그룹
- `403`: 권한 없음

---

### 6. 그룹 미션 완료 체크

**POST** `/group-missions/{group_id}/check`

그룹 미션의 완료 상태를 체크합니다.

**Path Parameters:**
- `group_id`: 그룹 미션 ID

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "date": "2024-11-15",
  "completed": true
}
```

**Response:**
```json
{
  "message": "완료 상태가 업데이트되었습니다"
}
```

---

## 친구/초대

### 1. 친구 목록 조회

**GET** `/friends`

현재 사용자의 친구 목록을 조회합니다.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
[
  {
    "id": 2,
    "name": "김철수",
    "activeDays": 15,
    "profileColor": "bg-blue-300"
  },
  {
    "id": 3,
    "name": "이영희",
    "activeDays": 20,
    "profileColor": "bg-pink-300"
  }
]
```

---

### 2. 그룹 미션 초대 보내기

**POST** `/group-missions/{group_id}/invite`

그룹 미션에 친구들을 초대합니다.

**Path Parameters:**
- `group_id`: 그룹 미션 ID

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "friend_ids": [2, 3, 4]
}
```

**Response:**
```json
{
  "message": "초대가 전송되었습니다",
  "invited_count": 3
}
```

**에러:**
- `400`: 그룹 인원이 가득 참
- `404`: 존재하지 않는 친구 ID

---

### 3. 받은 초대 목록 조회

**GET** `/invites/received`

현재 사용자가 받은 초대 목록을 조회합니다.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
[
  {
    "id": 1,
    "group_mission": {
      "id": 3,
      "name": "대중교통 이용하기",
      "participants": ["이준호", "박나영"],
      "color": "bg-green-400"
    },
    "from_user": {
      "id": 2,
      "name": "김철수",
      "activeDays": 15,
      "profileColor": "bg-blue-300"
    },
    "created_at": "2024-11-15T10:00:00Z"
  }
]
```

---

### 4. 초대 수락

**POST** `/invites/{invite_id}/accept`

받은 초대를 수락합니다.

**Path Parameters:**
- `invite_id`: 초대 ID

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "message": "초대를 수락했습니다",
  "group_mission": {
    "id": 3,
    "name": "대중교통 이용하기",
    "participants": ["이준호", "박나영", "현재사용자"],
    "color": "bg-green-400"
  }
}
```

**에러:**
- `400`: 그룹 인원이 가득 참
- `404`: 존재하지 않는 초대

---

### 5. 초대 거절

**DELETE** `/invites/{invite_id}/decline`

받은 초대를 거절합니다.

**Path Parameters:**
- `invite_id`: 초대 ID

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "message": "초대를 거절했습니다"
}
```

---

## 랭킹

### 1. 개인 랭킹 조회

**GET** `/ranking/personal`

전체 사용자의 개인 랭킹을 조회합니다.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "김민수",
    "score": 245,
    "streak": 28,
    "profile_color": "bg-yellow-300"
  },
  {
    "id": 2,
    "name": "이영희",
    "score": 238,
    "streak": 25,
    "profile_color": "bg-blue-300"
  },
  {
    "id": 3,
    "name": "박철수",
    "score": 220,
    "streak": 22,
    "profile_color": "bg-green-300"
  }
]
```

---

### 2. 그룹 랭킹 조회

**GET** `/ranking/group`

전체 그룹 미션의 랭킹을 조회합니다.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "일회용 컵 사용 안하기",
    "total_score": 1250,
    "member_count": 5,
    "color": "bg-blue-300"
  },
  {
    "id": 2,
    "name": "장바구니 들고 쇼핑하기",
    "total_score": 980,
    "member_count": 3,
    "color": "bg-purple-300"
  }
]
```

---

### 3. 내 순위 조회

**GET** `/ranking/my`

현재 사용자의 개인 및 그룹 랭킹 순위를 조회합니다.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "personal_rank": 4,
  "group_ranks": [
    {
      "group_id": 1,
      "rank": 2
    },
    {
      "group_id": 2,
      "rank": 5
    }
  ]
}
```

---

## 유틸리티

### 1. 서버 현재 날짜 조회

**GET** `/server/date`

서버의 현재 날짜를 조회합니다. 클라이언트와 서버의 날짜 동기화에 사용됩니다.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
"2024-11-15"
```

---

## 에러 코드

### HTTP 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 (Bad Request) |
| 401 | 인증 실패 (Unauthorized) |
| 403 | 권한 없음 (Forbidden) |
| 404 | 리소스를 찾을 수 없음 (Not Found) |
| 409 | 충돌 (Conflict, 예: 이미 참여 중인 그룹) |
| 500 | 서버 오류 (Internal Server Error) |

### 에러 응답 형식

```json
{
  "message": "에러 메시지",
  "code": "ERROR_CODE",
  "details": {
    "field": "추가 정보"
  }
}
```

### 주요 에러 메시지

- `"이메일 또는 비밀번호가 올바르지 않습니다."` - 로그인 실패
- `"인증이 만료되었습니다. 다시 로그인해주세요."` - 토큰 만료
- `"그룹 미션은 최대 3명까지 참여할 수 있어요"` - 그룹 인원 초과
- `"오늘이 아닌 날짜에는 추가할 수 없어요"` - 과거 날짜 미션 추가 불가
- `"이미 추가된 미션이에요"` - 중복 미션 추가

---

## 사용 예시

### JavaScript/TypeScript

```typescript
import { authApi, userApi, dayMissionApi } from './api/api';

// 로그인
const loginData = await authApi.login('user@example.com', 'password123');

// 사용자 정보 조회
const user = await userApi.getMe();

// 미션 추가
await dayMissionApi.addMission('2024-11-15', 101, '텀블러 사용하기');

// 그룹 참여
await groupMissionApi.joinGroup(1);
```

### cURL

```bash
# 로그인
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 사용자 정보 조회
curl -X GET http://localhost:8000/api/users/me \
  -H "Authorization: Bearer {access_token}"

# 미션 추가
curl -X POST http://localhost:8000/api/days/2024-11-15/missions \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{"mission_id": 101, "submission": "텀블러 사용하기"}'
```

---

## 버전 정보

- **API 버전**: v1
- **최종 업데이트**: 2024-11-15
- **문서 버전**: 1.0.0

---

## 문의 및 지원

API 관련 문의사항이나 버그 리포트는 개발팀에 문의해주세요.

