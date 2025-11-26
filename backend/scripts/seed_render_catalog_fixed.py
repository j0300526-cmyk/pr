#!/usr/bin/env python3
"""
Render/NCP DB에 catalog_topics + catalog_subtopics 데이터 시드
기존 데이터가 있어도 안전하게 실행 가능
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

# 1단계: 스키마 생성
SCHEMA_SQL = """
-- catalog_topics 없으면 만들고, 있으면 넘어감
CREATE TABLE IF NOT EXISTS catalog_topics (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

-- icon / active 컬럼이 없으면 추가
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='catalog_topics' AND column_name='icon') THEN
    ALTER TABLE catalog_topics ADD COLUMN icon TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='catalog_topics' AND column_name='active') THEN
    ALTER TABLE catalog_topics ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;

-- catalog_subtopics 없으면 생성
CREATE TABLE IF NOT EXISTS catalog_subtopics (
    id INTEGER PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES catalog_topics(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (topic_id, label)
);
"""

# 2단계: 대주제 삽입 (id 기준으로 UPSERT)
TOPICS_SQL = """
INSERT INTO catalog_topics (id, name, icon, active)
VALUES
  (1,  '일회용품 줄이기',          NULL, TRUE),
  (2,  '리필 & 재사용',           NULL, TRUE),
  (3,  '분리배출 개선',            NULL, TRUE),
  (4,  '음식물 쓰레기 줄이기',     NULL, TRUE),
  (5,  '학교 기반 활동',           NULL, TRUE),
  (6,  '착한 소비 (윤리적 구매)',  NULL, TRUE),
  (7,  '패션 & 뷰티 루틴',         NULL, TRUE),
  (8,  '이동 & 에너지 절약',       NULL, TRUE),
  (9,  '디지털 친환경 루틴',       NULL, TRUE),
  (10, '공유 & 나눔 문화',         NULL, TRUE),
  (11, '제로웨이스트 챌린지 데이', NULL, TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  active = EXCLUDED.active;
"""

# 3단계: 소주제 삽입 (id 기준으로 UPSERT)
SUBTOPICS_SQL = """
INSERT INTO catalog_subtopics (id, topic_id, label, display_order) VALUES
  -- 1. 일회용품 줄이기 (topic_id = 1)
  (10001, 1, '텀블러 사용하기',               0),
  (10002, 1, '장바구니 챙기기',               1),
  (10003, 1, '일회용 젓가락 안 받기',         2),
  (10004, 1, '물티슈 대신 손수건 사용하기',   3),

  -- 2. 리필 & 재사용 (topic_id = 2)
  (20001, 2, '세제 리필하기',                 0),
  (20002, 2, '공병 리필',                     1),
  (20003, 2, '빈병 반납하기',                 2),

  -- 3. 분리배출 개선 (topic_id = 3)
  (30001, 3, '플라스틱 라벨 제거',            0),
  (30002, 3, '투명페트 분리',                 1),
  (30003, 3, '플라스틱 물로 헹구고 분리수거하기', 2),

  -- 4. 음식물 쓰레기 줄이기 (topic_id = 4)
  (40001, 4, '남은 음식 리메이크',            0),
  (40002, 4, '유통기한 관리',                 1),
  (40003, 4, '냉장고 비우기',                 2),
  (40004, 4, '음식 남기지 않기',              3),

  -- 5. 학교 기반 활동 (topic_id = 5)
  (50001, 5, '중앙도서관 텀블러 세척기 사용하기', 0),
  (50002, 5, '기숙사 분리수거함 이용 인증',       1),
  (50003, 5, '캠퍼스 식당 종이컵 사용 안 하기',   2),

  -- 6. 착한 소비 (윤리적 구매) (topic_id = 6)
  (60001, 6, '리필 제품 구매',                 0),
  (60002, 6, '중고 거래',                      1),
  (60003, 6, '로컬 브랜드 구매',               2),

  -- 7. 패션 & 뷰티 루틴 (topic_id = 7)
  (70001, 7, '헌옷 리폼',                      0),
  (70002, 7, '공병 수거',                      1),
  (70003, 7, '천연소재 제품 사용',             2),

  -- 8. 이동 & 에너지 절약 (topic_id = 8)
  (80001, 8, '걸어서 이동',                    0),
  (80002, 8, '자전거 출근',                    1),
  (80003, 8, '콘센트 뽑기',                    2),

  -- 9. 디지털 친환경 루틴 (topic_id = 9)
  (90001, 9, '클라우드 정리',                  0),
  (90002, 9, '오래된 메일 삭제',               1),
  (90003, 9, '전자기기 재활용',                2),

  -- 10. 공유 & 나눔 문화 (topic_id = 10)
  (100001, 10, '물건 공유',                    0),
  (100002, 10, '제로웨이스트 워크숍 참여',     1),
  (100003, 10, '중고 나눔',                    2),

  -- 11. 제로웨이스트 챌린지 데이 (topic_id = 11)
  (110001, 11, '하루 일회용품 0개',            0),
  (110002, 11, '7일간 다회용 인증',            1)
ON CONFLICT (id) DO UPDATE SET
  topic_id = EXCLUDED.topic_id,
  label = EXCLUDED.label,
  display_order = EXCLUDED.display_order;
"""

def main():
    print("🔄 Render/NCP DB 카탈로그 시드 시작...")
    
    try:
        with engine.begin() as conn:
            # 1단계: 스키마 생성
            print("📋 1단계: 스키마 생성 중...")
            conn.execute(text(SCHEMA_SQL))
            print("✅ 스키마 생성 완료")
            
            # 2단계: 대주제 삽입
            print("📋 2단계: 대주제 삽입 중...")
            result = conn.execute(text(TOPICS_SQL))
            print(f"✅ 대주제 삽입 완료 (영향받은 행: {result.rowcount})")
            
            # 3단계: 소주제 삽입
            print("📋 3단계: 소주제 삽입 중...")
            result = conn.execute(text(SUBTOPICS_SQL))
            print(f"✅ 소주제 삽입 완료 (영향받은 행: {result.rowcount})")
            
            # 결과 확인
            topics_count = conn.execute(text("SELECT COUNT(*) FROM catalog_topics")).scalar()
            subtopics_count = conn.execute(text("SELECT COUNT(*) FROM catalog_subtopics")).scalar()
            
            print("\n📊 최종 결과:")
            print(f"   - catalog_topics: {topics_count}개")
            print(f"   - catalog_subtopics: {subtopics_count}개")
            
            # 각 topic별 subtopic 개수 확인
            print("\n📋 Topic별 소주제 개수:")
            topic_counts = conn.execute(text("""
                SELECT t.id, t.name, COUNT(s.id) as subtopic_count
                FROM catalog_topics t
                LEFT JOIN catalog_subtopics s ON t.id = s.topic_id
                GROUP BY t.id, t.name
                ORDER BY t.id
            """)).fetchall()
            
            for topic_id, topic_name, count in topic_counts:
                print(f"   - [{topic_id}] {topic_name}: {count}개")
            
    except Exception as e:
        print(f"❌ 에러 발생: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    main()
