#!/usr/bin/env python3
"""
catalog_missions 테이블 마이그레이션: examples를 JSON 배열로 변경
"""
import sqlite3
import json
import os

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
        
        # 새로운 테이블 생성 (JSON 타입 사용)
        cursor.execute("""
            CREATE TABLE catalog_missions_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category VARCHAR NOT NULL,
                examples JSON NOT NULL,
                score INTEGER DEFAULT 10,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 기존 데이터 마이그레이션 (없으면 스킵)
        try:
            cursor.execute("SELECT id, category, examples FROM catalog_missions")
            old_data = cursor.fetchall()
            
            for row_id, category, examples_str in old_data:
                # 문자열을 배열로 변환
                examples_list = [ex.strip() for ex in examples_str.split("/") if ex.strip()]
                examples_json = json.dumps(examples_list, ensure_ascii=False)
                
                cursor.execute("""
                    INSERT INTO catalog_missions_new (id, category, examples, score)
                    VALUES (?, ?, ?, 10)
                """, (row_id, category, examples_json))
                print(f"Migrated: {category}")
        except sqlite3.OperationalError:
            # 테이블이 없으면 스킵
            print("(Old table not found, skipping data migration)")
        
        # 기존 테이블 제거
        try:
            cursor.execute("DROP TABLE catalog_missions")
        except sqlite3.OperationalError:
            pass
        
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
