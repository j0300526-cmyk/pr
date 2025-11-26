#!/usr/bin/env python3
"""
Render/NCP DB에 "학교 기반 활동" 대주제 + 소주제 3개만 추가
기존 데이터는 건드리지 않음
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# DATABASE_URL 환경변수에서 가져오기
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

engine = create_engine(DATABASE_URL, future=True)

SQL = """
-- 0) 스키마 보정: 테이블이 없으면 만들어두기 (있으면 그냥 넘어감)

CREATE TABLE IF NOT EXISTS catalog_topics (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE catalog_topics ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE catalog_topics ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS catalog_subtopics (
    id INTEGER PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES catalog_topics(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (topic_id, label)
);

-- 1) 학교 기반 활동 대주제만 추가 (id = 11)
INSERT INTO catalog_topics (id, name, icon, active)
VALUES
  (11, '학교 기반 활동', NULL, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2) 학교 기반 활동 소주제 3개 추가
INSERT INTO catalog_subtopics (id, topic_id, label, display_order) VALUES
  (110001, 11, '중앙도서관 텀블러 세척기 사용하기', 0),
  (110002, 11, '기숙사 분리수거함 이용 인증',       1),
  (110003, 11, '캠퍼스 식당 종이컵 사용 안 하기',   2)
ON CONFLICT (id) DO NOTHING;
"""

def main():
    print("🔄 Render/NCP DB에 '학교 기반 활동' 추가 중...")
    
    try:
        with engine.begin() as conn:
            # SQL 실행
            conn.execute(text(SQL))
            print("✅ '학교 기반 활동' 추가 완료!")
            
            # 결과 확인
            topic_11 = conn.execute(text("""
                SELECT id, name, active 
                FROM catalog_topics 
                WHERE id = 11
            """)).fetchone()
            
            if topic_11:
                print(f"✅ 대주제 확인: id={topic_11[0]}, name={topic_11[1]}")
            else:
                print("⚠️  대주제 id=11이 없습니다 (이미 존재했을 수 있음)")
            
            subtopics_count = conn.execute(text("""
                SELECT COUNT(*) 
                FROM catalog_subtopics 
                WHERE topic_id = 11
            """)).scalar()
            
            print(f"✅ 소주제 개수: {subtopics_count}개")
            
            if subtopics_count > 0:
                subtopics = conn.execute(text("""
                    SELECT id, label, display_order
                    FROM catalog_subtopics
                    WHERE topic_id = 11
                    ORDER BY display_order
                """)).fetchall()
                
                print("\n📋 소주제 목록:")
                for sub_id, label, order in subtopics:
                    print(f"   - [{sub_id}] {label} (순서: {order})")
            
    except Exception as e:
        print(f"❌ 에러 발생: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    main()

