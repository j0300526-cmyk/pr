# database.py
# =======================
# 데이터베이스 연결 및 세션 관리
# =======================

from sqlalchemy import create_engine, text, inspect, event, MetaData
from sqlalchemy.orm import sessionmaker, declarative_base
from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from dotenv import load_dotenv

load_dotenv()


# 환경 변수에서 직접 DATABASE_URL 읽기
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./zero_waste.db")

print(f"[DEBUG] DATABASE_URL: {DATABASE_URL[:50]}..." if len(DATABASE_URL) > 50 else f"[DEBUG] DATABASE_URL: {DATABASE_URL}")

# SQLite 사용 시 check_same_thread=False 필요
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=True,  # 개발 시 SQL 쿼리 로그 출력
    )
else:
    # PostgreSQL 사용 시 public 스키마 명시적 설정
    engine = create_engine(
        DATABASE_URL,
        connect_args={"options": "-c search_path=public"},
        echo=True
    )
    # 추가 안전장치: 모든 커넥션에 대해 search_path 설정
    @event.listens_for(engine, "connect")
    def set_search_path(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("SET search_path TO public")
        cursor.close()
    # 스키마가 없을 경우 생성
    with engine.connect() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS public"))
        conn.execute(text("SET search_path TO public"))

# 세션 팩토리
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

metadata = MetaData(schema="public") if not DATABASE_URL.startswith("sqlite") else MetaData()

# Base 모델
Base = declarative_base(metadata=metadata)


# 스키마 보조 함수
def _ensure_new_unique_index(conn):
    indexes = conn.execute(text("PRAGMA index_list('day_missions')")).fetchall()
    for idx in indexes:
        idx_name = idx[1]
        if not idx[2]:
            continue
        info = conn.execute(text(f"PRAGMA index_info('{idx_name}')")).fetchall()
        cols = [row[2] for row in info]
        if cols == ["user_id", "date", "sub_mission"]:
            return
    conn.execute(
        text(
            "CREATE UNIQUE INDEX IF NOT EXISTS "
            "uq_user_date_sub_mission ON day_missions (user_id, date, sub_mission)"
        )
    )


def _rebuild_day_missions(conn):
    conn.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS day_missions_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                mission_id INTEGER NOT NULL,
                date DATE NOT NULL,
                sub_mission TEXT NOT NULL,
                completed BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(mission_id) REFERENCES catalog_missions(id)
            )
            """
        )
    )
    conn.execute(
        text(
            """
            INSERT INTO day_missions_new (id, user_id, mission_id, date, sub_mission, completed, created_at)
            SELECT
                id,
                user_id,
                mission_id,
                date,
                CASE
                    WHEN sub_mission IS NOT NULL AND TRIM(sub_mission) <> '' THEN sub_mission
                    ELSE COALESCE(
                        (SELECT category FROM catalog_missions WHERE catalog_missions.id = day_missions.mission_id),
                        'legacy-' || mission_id
                    )
                END,
                completed,
                created_at
            FROM day_missions
            """
        )
    )
    conn.execute(text("DROP TABLE day_missions"))
    conn.execute(text("ALTER TABLE day_missions_new RENAME TO day_missions"))


def ensure_day_mission_schema():
    inspector = inspect(engine)
    if "day_missions" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("day_missions")}
    with engine.begin() as conn:
        if "sub_mission" not in columns:
            conn.execute(text("ALTER TABLE day_missions ADD COLUMN sub_mission TEXT"))
            conn.execute(
                text(
                    "UPDATE day_missions "
                    "SET sub_mission = ("
                    "    SELECT COALESCE(category, 'legacy-' || day_missions.mission_id) "
                    "    FROM catalog_missions "
                    "    WHERE catalog_missions.id = day_missions.mission_id"
                    ") "
                    "WHERE sub_mission IS NULL OR sub_mission = ''"
                )
            )

        indexes = conn.execute(text("PRAGMA index_list('day_missions')")).fetchall()
        needs_rebuild = False
        target_cols = {"user_id", "mission_id", "date"}
        for idx in indexes:
            idx_name = idx[1]
            is_unique = bool(idx[2])
            origin = idx[3]
            if not is_unique:
                continue
            info = conn.execute(text(f"PRAGMA index_info('{idx_name}')")).fetchall()
            cols = [row[2] for row in info]
            if set(cols) == target_cols and len(cols) == len(target_cols):
                if idx_name.startswith("sqlite_autoindex"):
                    needs_rebuild = True
                else:
                    conn.execute(text(f'DROP INDEX IF EXISTS "{idx_name}"'))
        if needs_rebuild:
            _rebuild_day_missions(conn)
        _ensure_new_unique_index(conn)


# 데이터베이스 세션 의존성 (FastAPI에서 Depends(get_db)로 사용)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
