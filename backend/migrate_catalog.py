#!/usr/bin/env python3
"""
catalog_missions 테이블 마이그레이션: name 제거, examples/score 추가
"""
import sqlite3
import os
from datetime import datetime

db_path = os.path.join(os.path.dirname(__file__), "zero_waste.db")

def migrate():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print(f"DB path: {db_path}")
    
    try:
        # 기존 테이블 확인
        cursor.execute("PRAGMA table_info(catalog_missions)")
        columns = [col[1] for col in cursor.fetchall()]
        print(f"Current columns: {columns}")
        
        # 이미 examples가 있으면 스킵
        if "examples" in columns:
            print("✓ Schema already updated (examples column exists)")
            conn.close()
            return
        
        # 새로운 테이블 생성
        cursor.execute("""
            CREATE TABLE catalog_missions_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category VARCHAR NOT NULL,
                examples VARCHAR NOT NULL,
                score INTEGER DEFAULT 10,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 기존 데이터 마이그레이션 (category만 유지, 나머지는 초기값)
        cursor.execute("""
            INSERT INTO catalog_missions_new (category, examples, score)
            SELECT category, category || ' (기존 데이터)', 10 FROM catalog_missions
        """)
        
        # 기존 테이블 제거
        cursor.execute("DROP TABLE catalog_missions")
        
        # 새 테이블 이름 변경
        cursor.execute("ALTER TABLE catalog_missions_new RENAME TO catalog_missions")
        
        conn.commit()
        print("✓ Schema migration completed")
        
    except Exception as e:
        print(f"✗ Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
