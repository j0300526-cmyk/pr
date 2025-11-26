#!/usr/bin/env python3
"""
topic_id=11의 소주제 확인 (Render DB)
check_render_catalog.py와 동일한 형식
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
    print("✅ Render DB 연결 성공\n")
    
    with engine.connect() as conn:
        # topic_id=11 확인
        topic_11 = conn.execute(text("""
            SELECT id, name
            FROM catalog_topics
            WHERE id = 11
        """)).fetchone()
        
        if topic_11:
            print(f"📌 catalog_topics (id=11):")
            print(f"{{'id': {topic_11[0]}, 'name': '{topic_11[1]}'}}\n")
        else:
            print("⚠️  topic_id=11이 없습니다!\n")
            return
        
        # topic_id=11의 소주제 확인
        subtopics = conn.execute(text("""
            SELECT id, topic_id, label, display_order
            FROM catalog_subtopics
            WHERE topic_id = 11
            ORDER BY display_order
        """)).fetchall()
        
        print(f"📌 catalog_subtopics (topic_id=11) 현재 데이터 ({len(subtopics)}개):")
        
        if subtopics:
            for sub_id, topic_id, label, order in subtopics:
                print(f"{{'id': {sub_id}, 'topic_id': {topic_id}, 'label': '{label}', 'display_order': {order}}}")
        else:
            print("⚠️  소주제가 없습니다!")
            print("   → seed_render_catalog.py를 다시 실행해주세요.")

if __name__ == "__main__":
    main()

