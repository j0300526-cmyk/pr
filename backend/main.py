# FastAPI 메인 애플리케이션
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, ensure_day_mission_schema
from routers import auth, users, missions, day_missions, group_missions, friends, ranking, utils, kakao_auth, personal_routine
from routers import debug
import os
from dotenv import load_dotenv

load_dotenv()

# 데이터베이스 테이블 생성 및 스키마 보정
Base.metadata.create_all(bind=engine)
ensure_day_mission_schema()

app = FastAPI(
    title="Zero Waste Routine API",
    description="친환경 미션 추적 앱 API",
    version="1.0.0"
)

# CORS 설정
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    # allow_origins는 환경변수로 설정한 값을 사용합니다. 개발 중이라면
    # 'http://localhost:5173' 같은 클라이언트를 포함하도록 설정하세요.
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router, prefix="/api")
app.include_router(kakao_auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(missions.router, prefix="/api")
app.include_router(day_missions.router, prefix="/api")
app.include_router(personal_routine.router, prefix="/api")
app.include_router(group_missions.router, prefix="/api")
app.include_router(friends.router, prefix="/api")
app.include_router(ranking.router, prefix="/api")
app.include_router(utils.router, prefix="/api")
# 디버깅 라우터 (개발 환경에서만)
if os.getenv("ENV") != "production":
    app.include_router(debug.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "Zero Waste Routine API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

