#!/usr/bin/env python3
"""
카탈로그 DB 상태 확인 스크립트
- catalog_topics 개수 및 목록
- catalog_subtopics 개수 및 topic_id별 분포
- 관계 확인

사용법:
    cd C:\pr_11_15_VER3\backend
    python scripts/check_catalog_db.py
"""
import os
import sys

# backend 디렉토리를 경로에 추가 (가상환경이 활성화되어 있어야 함)
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

# .env 파일 경로 설정 (여러 위치 확인)
from dotenv import load_dotenv

# 1. backend 디렉토리의 .env
env_path = os.path.join(backend_dir, '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"✅ .env 파일 로드: {env_path}")

# 2. 프로젝트 루트의 .env
project_root = os.path.dirname(backend_dir)
env_path = os.path.join(project_root, '.env')
if os.path.exists(env_path):
    load_dotenv(env_path, override=True)
    print(f"✅ .env 파일 로드: {env_path}")

# 3. catalog_migration 디렉토리의 .env (사용자가 작업 중인 디렉토리)
catalog_migration_path = os.path.join(os.path.expanduser("~"), "catalog_migration", ".env")
if os.path.exists(catalog_migration_path):
    load_dotenv(catalog_migration_path, override=True)
    print(f"✅ .env 파일 로드: {catalog_migration_path}")

# 4. 현재 작업 디렉토리의 .env
current_dir_env = os.path.join(os.getcwd(), '.env')
if os.path.exists(current_dir_env):
    load_dotenv(current_dir_env, override=True)
    print(f"✅ .env 파일 로드: {current_dir_env}")

try:
    from sqlalchemy import create_engine, text
except ImportError:
    print("❌ sqlalchemy 모듈을 찾을 수 없습니다.")
    print("\n해결 방법:")
    print("1. 가상환경을 활성화하세요:")
    print("   cd C:\\pr_11_15_VER3\\backend")
    print("   # Windows: .venv\\Scripts\\activate")
    print("   # 또는: python -m venv .venv && .venv\\Scripts\\activate")
    print("2. 필요한 패키지를 설치하세요:")
    print("   pip install sqlalchemy python-dotenv psycopg2-binary")
    print("\n또는 backend 디렉토리에서 실행하세요:")
    print("   cd C:\\pr_11_15_VER3\\backend")
    print("   python scripts/check_catalog_db.py")
    sys.exit(1)

DATABASE_URL = os.getenv("DATABASE_URL")

# 로컬 SQLite인 경우 경고
if not DATABASE_URL or DATABASE_URL.startswith("sqlite"):
    print("⚠️  로컬 SQLite DB에 연결되어 있습니다.")
    print("   Render DB를 확인하려면 DATABASE_URL을 Render PostgreSQL URL로 설정하세요.")
    print("\n사용 방법:")
    print("1. .env 파일에 Render DB URL 추가:")
    print("   DATABASE_URL=postgresql://user:password@host:port/dbname")
    print("\n2. 또는 환경변수로 직접 설정:")
    print("   set DATABASE_URL=postgresql://...")
    print("\n3. 또는 스크립트 실행 시 직접 입력하세요.")
    print("\n" + "="*60)
    response = input("Render DB URL을 직접 입력하시겠습니까? (y/n): ")
    if response.lower() == 'y':
        db_url = input("DATABASE_URL을 입력하세요: ").strip()
        if db_url:
            DATABASE_URL = db_url
        else:
            print("❌ URL이 입력되지 않았습니다.")
            exit(1)
    else:
        print("❌ Render DB URL이 필요합니다.")
        exit(1)

if not DATABASE_URL:
    print("❌ DATABASE_URL 환경변수가 없습니다.")
    print("   .env 파일을 확인하거나 환경변수를 설정하세요.")
    exit(1)

engine = create_engine(DATABASE_URL, future=True)

def main():
    print("🔍 카탈로그 DB 상태 확인 중...\n")
    
    try:
        with engine.connect() as conn:
            # 1. catalog_topics 확인
            print("=" * 60)
            print("1️⃣ catalog_topics 테이블")
            print("=" * 60)
            
            topics_count = conn.execute(text("SELECT COUNT(*) FROM catalog_topics")).scalar()
            print(f"📊 총 개수: {topics_count}개\n")
            
            if topics_count == 0:
                print("⚠️  catalog_topics 테이블이 비어있습니다!")
                return
            
            topics = conn.execute(text("""
                SELECT id, name, active, 
                       (SELECT COUNT(*) FROM catalog_subtopics WHERE topic_id = catalog_topics.id) as subtopics_count
                FROM catalog_topics
                ORDER BY id
            """)).fetchall()
            
            print("📋 대주제 목록:")
            for topic_id, name, active, subtopics_count in topics:
                active_str = "✅" if active else "❌"
                print(f"   [{topic_id:2d}] {active_str} {name:30s} (소주제: {subtopics_count}개)")
            
            # 2. catalog_subtopics 확인
            print("\n" + "=" * 60)
            print("2️⃣ catalog_subtopics 테이블")
            print("=" * 60)
            
            subtopics_count = conn.execute(text("SELECT COUNT(*) FROM catalog_subtopics")).scalar()
            print(f"📊 총 개수: {subtopics_count}개\n")
            
            if subtopics_count == 0:
                print("⚠️  catalog_subtopics 테이블이 비어있습니다!")
                return
            
            # topic_id별 분포
            topic_distribution = conn.execute(text("""
                SELECT topic_id, COUNT(*) as count
                FROM catalog_subtopics
                GROUP BY topic_id
                ORDER BY topic_id
            """)).fetchall()
            
            print("📋 topic_id별 소주제 분포:")
            for topic_id, count in topic_distribution:
                topic_name = next((t[1] for t in topics if t[0] == topic_id), "알 수 없음")
                print(f"   topic_id={topic_id:2d} ({topic_name:30s}): {count}개")
            
            # 3. 문제 확인
            print("\n" + "=" * 60)
            print("3️⃣ 문제 확인")
            print("=" * 60)
            
            # 소주제가 없는 topic 찾기
            topics_without_subtopics = conn.execute(text("""
                SELECT t.id, t.name
                FROM catalog_topics t
                LEFT JOIN catalog_subtopics s ON t.id = s.topic_id
                WHERE s.id IS NULL
                ORDER BY t.id
            """)).fetchall()
            
            if topics_without_subtopics:
                print("⚠️  소주제가 없는 대주제:")
                for topic_id, name in topics_without_subtopics:
                    print(f"   - [{topic_id}] {name}")
            else:
                print("✅ 모든 대주제에 소주제가 있습니다.")
            
            # orphaned subtopics (topic_id가 존재하지 않는 subtopics)
            orphaned_subtopics = conn.execute(text("""
                SELECT s.id, s.topic_id, s.label
                FROM catalog_subtopics s
                LEFT JOIN catalog_topics t ON s.topic_id = t.id
                WHERE t.id IS NULL
                LIMIT 10
            """)).fetchall()
            
            if orphaned_subtopics:
                print("\n⚠️  잘못된 topic_id를 참조하는 소주제:")
                for sub_id, topic_id, label in orphaned_subtopics:
                    print(f"   - id={sub_id}, topic_id={topic_id} (존재하지 않음), label='{label}'")
            else:
                print("✅ 모든 소주제가 유효한 topic_id를 참조합니다.")
            
            # 4. 샘플 데이터 확인
            print("\n" + "=" * 60)
            print("4️⃣ 샘플 데이터 (topic_id=1)")
            print("=" * 60)
            
            sample_subtopics = conn.execute(text("""
                SELECT id, topic_id, label, display_order
                FROM catalog_subtopics
                WHERE topic_id = 1
                ORDER BY display_order, id
                LIMIT 5
            """)).fetchall()
            
            if sample_subtopics:
                print("📋 topic_id=1의 소주제 샘플:")
                for sub_id, topic_id, label, order in sample_subtopics:
                    print(f"   - id={sub_id}, label='{label}', order={order}")
            else:
                print("⚠️  topic_id=1에 소주제가 없습니다.")
            
            # 5. 요약
            print("\n" + "=" * 60)
            print("5️⃣ 요약")
            print("=" * 60)
            print(f"✅ 대주제: {topics_count}개")
            print(f"✅ 소주제: {subtopics_count}개")
            print(f"✅ 평균 소주제/대주제: {subtopics_count / topics_count if topics_count > 0 else 0:.1f}개")
            
            if topics_count < 11:
                print(f"\n⚠️  대주제가 11개가 아닙니다! (현재: {topics_count}개)")
                print("   → seed 스크립트를 실행하세요.")
            
            if subtopics_count == 0:
                print("\n⚠️  소주제가 없습니다!")
                print("   → seed 스크립트를 실행하세요.")
            
    except Exception as e:
        print(f"❌ 에러 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

