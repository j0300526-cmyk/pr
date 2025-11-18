# API 최적화 제안

## 현재 문제점

1. **중복 API 호출**: `/days/{date}/missions` API가 한 번의 화면 동작마다 4~6번 반복 호출됨
2. **지연 시간**: 각 요청당 약 1초 소요 (Render(미국) ↔ 네이버 클라우드(한국) 간 지리적 지연)
3. **불필요한 네트워크 요청**: 같은 날짜의 데이터를 여러 번 요청

## 프론트엔드 최적화 (완료)

### 1. 중복 호출 방지
- `loadDay` 함수를 `useCallback`으로 메모이제이션
- 로딩 상태 추적을 위한 `loadingDatesRef` 추가
- 이미 로딩 중인 날짜는 추가 요청 무시

### 2. 불필요한 리렌더링 방지
- `currentMissions`를 `useMemo`로 메모이제이션
- `useEffect` 의존성 배열 최적화

## 백엔드 최적화 제안

### 1. 주간 단위 API 추가 (권장)

현재는 날짜별로만 조회 가능하지만, 주간 단위로 묶어서 조회하는 API를 추가하면 네트워크 요청 수를 크게 줄일 수 있습니다.

**새로운 엔드포인트 제안:**
```
GET /days/week/{week_start_date}/missions
```

**예시:**
```python
@router.get("/week/{week_start_date}/missions")
async def get_week_missions(
    week_start_date: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """특정 주의 모든 날짜 미션 조회 (월요일~일요일)"""
    try:
        start_date = datetime.strptime(week_start_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)"
        )
    
    sunday = get_sunday_of_week(start_date)
    
    # 주간의 모든 일일 미션 조회 (한 번의 쿼리로)
    day_missions = db.query(DayMission).filter(
        and_(
            DayMission.user_id == current_user.id,
            DayMission.date >= start_date,
            DayMission.date <= sunday
        )
    ).all()
    
    # 주간 루틴 조회
    weekly_routines = db.query(WeeklyPersonalRoutine).filter(
        and_(
            WeeklyPersonalRoutine.user_id == current_user.id,
            WeeklyPersonalRoutine.week_start_date == start_date
        )
    ).all()
    
    # 날짜별로 그룹화하여 반환
    result = {}
    for date in [start_date + timedelta(days=i) for i in range(7)]:
        result[date.isoformat()] = []
        # 해당 날짜의 미션 필터링 및 변환
        # ...
    
    return result
```

**프론트엔드 사용 예시:**
```typescript
// 주간 단위로 미션 로드
const loadWeek = async (weekStartDate: string) => {
  const weekMissions = await api(`/days/week/${weekStartDate}/missions`);
  // weekMissions는 { "2024-11-18": [...], "2024-11-19": [...], ... } 형태
  setMissions(prev => ({ ...prev, ...weekMissions }));
};
```

**장점:**
- 네트워크 요청 수: 7회 → 1회로 감소
- 총 지연 시간: 7초 → 1초로 감소
- DB 쿼리 최적화 가능 (한 번의 쿼리로 주간 데이터 조회)

### 2. 캐싱 추가

같은 주의 데이터는 캐시하여 중복 요청을 방지할 수 있습니다.

```python
from functools import lru_cache
from datetime import date

@lru_cache(maxsize=128)
def get_week_missions_cached(
    user_id: int,
    week_start_date: date
):
    # 캐시된 데이터 반환
    pass
```

**주의사항:**
- 미션 추가/수정/삭제 시 캐시 무효화 필요
- 사용자별 캐시 관리 필요

### 3. DB 쿼리 최적화

**인덱스 확인:**
```sql
-- day_missions 테이블에 인덱스가 있는지 확인
CREATE INDEX IF NOT EXISTS idx_day_missions_user_date 
ON day_missions(user_id, date);

-- 주간 루틴 조회 최적화
CREATE INDEX IF NOT EXISTS idx_weekly_routines_user_week 
ON weekly_personal_routines(user_id, week_start_date);
```

**JOIN 최적화:**
- 현재는 N+1 쿼리 문제가 있을 수 있음 (각 미션마다 mission 정보 조회)
- `joinedload` 또는 `selectinload` 사용 고려

```python
from sqlalchemy.orm import joinedload

day_missions = db.query(DayMission)\
    .options(joinedload(DayMission.mission))\
    .filter(...)\
    .all()
```

### 4. 응답 압축

FastAPI에서 응답 압축을 활성화하면 네트워크 전송 시간을 줄일 수 있습니다.

```python
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

### 5. CDN 또는 엣지 캐싱

정적 데이터나 자주 변경되지 않는 데이터는 CDN을 통해 캐싱할 수 있습니다.

## 구현 우선순위

1. ✅ **프론트엔드 중복 호출 방지** (완료)
2. 🔄 **주간 단위 API 추가** (권장, 높은 효과)
3. 🔄 **DB 인덱스 확인 및 추가** (중간 효과)
4. 🔄 **쿼리 최적화 (JOIN)** (중간 효과)
5. ⏳ **캐싱 추가** (낮은 우선순위, 복잡도 높음)
6. ⏳ **응답 압축** (낮은 우선순위, 효과 낮음)

## 예상 효과

### 현재 (최적화 전)
- 날짜 변경 시: 4~6회 요청 × 1초 = 4~6초
- 주간 데이터 로드: 7일 × 4~6회 = 28~42회 요청

### 주간 API 추가 후
- 날짜 변경 시: 1회 요청 × 1초 = 1초 (첫 로드 시)
- 주간 데이터 로드: 1회 요청 × 1초 = 1초
- **효과: 약 85~95% 요청 수 감소**

## 추가 고려사항

1. **지리적 지연 해결**: 
   - Render 서버를 한국 리전으로 이전 (가장 효과적)
   - 또는 네이버 클라우드 DB를 미국 리전으로 이전
   - 또는 API Gateway를 한국에 배치하여 프록시 역할

2. **Connection Pooling**:
   - DB 연결 풀 크기 최적화
   - 연결 재사용으로 연결 설정 시간 단축

3. **비동기 처리**:
   - FastAPI는 이미 비동기이지만, DB 쿼리도 비동기로 처리 가능
   - `asyncpg` 또는 `aiomysql` 사용 고려

