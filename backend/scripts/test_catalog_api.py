#!/usr/bin/env python3
"""
카탈로그 API 응답 형식 테스트 (로컬 DB 사용)
"""
import sys
import os

# 프로젝트 루트를 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from database import SessionLocal
from models import CatalogTopic
from services.catalog_utils import build_catalog_category_payload
from sqlalchemy.orm import joinedload

def test_catalog_query():
    """카탈로그 쿼리 테스트"""
    db: Session = SessionLocal()
    
    try:
        print("🔍 카탈로그 쿼리 테스트 시작...\n")
        
        # 실제 API와 동일한 쿼리
        topics = (
            db.query(CatalogTopic)
            .options(joinedload(CatalogTopic.subtopics))
            .order_by(CatalogTopic.id)
            .all()
        )
        
        print(f"✅ 총 {len(topics)}개 대주제 발견\n")
        
        # 각 topic별로 응답 형식 확인
        for topic in topics:
            payload = build_catalog_category_payload(topic)
            print(f"📋 [{payload['id']}] {payload['category']}")
            print(f"   소주제 {len(payload['sub_missions'])}개:")
            
            for sub in payload['sub_missions']:
                print(f"      - id={sub['id']}, label='{sub['label']}'")
            print()
        
        # topic_id=11 확인
        topic_11 = next((t for t in topics if t.id == 11), None)
        if topic_11:
            print("✅ topic_id=11 '학교 기반 활동' 확인됨")
            payload_11 = build_catalog_category_payload(topic_11)
            print(f"   소주제 개수: {len(payload_11['sub_missions'])}개")
            if len(payload_11['sub_missions']) == 0:
                print("   ⚠️  소주제가 없습니다! seed 스크립트를 다시 실행해주세요.")
            else:
                print("   소주제 목록:")
                for sub in payload_11['sub_missions']:
                    print(f"      - id={sub['id']}, label='{sub['label']}'")
        else:
            print("⚠️  topic_id=11이 없습니다!")
        
    except Exception as e:
        print(f"❌ 에러 발생: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_catalog_query()

