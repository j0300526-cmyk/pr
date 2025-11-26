#!/usr/bin/env python3
"""
topic_id=11의 소주제 확인 (dotenv 없이)
"""
import os
from sqlalchemy import create_engine, text

# 환경변수에서 직접 읽기 (dotenv 없이)
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("❌ DATABASE_URL 환경변수가 없습니다.")
    print("   export DATABASE_URL='postgresql://...' 또는")
    print("   .env 파일을 사용하려면 python-dotenv를 설치하세요: pip install python-dotenv")
    exit(1)

try:
    engine = create_engine(DATABASE_URL, future=True)
    
    with engine.connect() as conn:
        # topic_id=11 확인
        topic_11 = conn.execute(text("""
            SELECT id, name
            FROM catalog_topics
            WHERE id = 11
        """)).fetchone()
        
        if topic_11:
            print(f"✅ topic_id=11 발견: {topic_11[1]}\n")
        else:
            print("⚠️  topic_id=11이 없습니다!\n")
            exit(1)
        
        # topic_id=11의 소주제 확인
        result = conn.execute(text("""
            SELECT id, topic_id, label, display_order
            FROM catalog_subtopics
            WHERE topic_id = 11
            ORDER BY display_order
        """)).fetchall()
        
        print(f"📌 topic_id=11의 소주제: {len(result)}개\n")
        
        if result:
            for r in result:
                print(f"  id={r[0]}, label='{r[2]}', order={r[3]}")
        else:
            print("⚠️  소주제가 없습니다!")
            print("   → seed_render_catalog.py를 다시 실행해주세요.")
            
except Exception as e:
    print(f"❌ 에러: {e}")
    import traceback
    traceback.print_exc()

