#!/usr/bin/env python
"""데이터베이스에 kakao_id 컬럼 추가 스크립트"""
import sqlite3
import os

# 데이터베이스 경로
db_path = "zero_waste.db"

if not os.path.exists(db_path):
    print(f"❌ {db_path} 파일이 존재하지 않습니다.")
    exit(1)

# SQLite 연결
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # kakao_id 컬럼 추가
    print("🔧 users 테이블에 kakao_id 컬럼 추가 중...")
    cursor.execute("ALTER TABLE users ADD COLUMN kakao_id TEXT")
    
    # 인덱스 추가 (선택적, 성능 향상)
    print("🔧 kakao_id 인덱스 추가 중...")
    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_kakao_id ON users(kakao_id)")
    
    conn.commit()
    print("✅ kakao_id 컬럼이 성공적으로 추가되었습니다!")
    
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("ℹ️  kakao_id 컬럼이 이미 존재합니다.")
    else:
        print(f"❌ 에러 발생: {e}")
        conn.rollback()
finally:
    conn.close()

print("\n🎉 완료! 이제 백엔드 서버를 다시 시작하세요:")
print("   python -m uvicorn main:app --reload")

