#!/usr/bin/env python3
"""
catalog_missions 테이블 초기화 및 재생성
"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "zero_waste.db")

def reset_catalog_table():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print(f"DB path: {db_path}")
    
    try:
        # 기존 테이블 삭제
        cursor.execute("DROP TABLE IF EXISTS catalog_missions")
        print("✓ Dropped old catalog_missions table")
        
        # 새 테이블 생성
        cursor.execute("""
            CREATE TABLE catalog_missions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category VARCHAR NOT NULL,
                example VARCHAR NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Created new catalog_missions table")
        
        conn.commit()
        
    except Exception as e:
        print(f"✗ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    reset_catalog_table()
