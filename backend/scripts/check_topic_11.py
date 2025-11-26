#!/usr/bin/env python3
"""
topic_id=11의 소주제 확인
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

engine = create_engine(DATABASE_URL, future=True)

def main():
    with engine.connect() as conn:
        # topic_id=11의 소주제 확인
        subtopics = conn.execute(text("""
            SELECT id, topic_id, label, display_order
            FROM catalog_subtopics
            WHERE topic_id = 11
            ORDER BY display_order
        """)).fetchall()
        
        print(f"📌 topic_id=11의 소주제 개수: {len(subtopics)}개\n")
        
        if subtopics:
            print("✅ 소주제 목록:")
            for sub_id, topic_id, label, order in subtopics:
                print(f"   - id={sub_id}, label='{label}', order={order}")
        else:
            print("⚠️  topic_id=11의 소주제가 없습니다!")
            print("   → seed_render_catalog.py를 다시 실행해주세요.")

if __name__ == "__main__":
    main()

