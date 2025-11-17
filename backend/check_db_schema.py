import sqlite3

db = sqlite3.connect('zero_waste.db')
cursor = db.cursor()

# 모든 테이블 조회
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("테이블 목록:")
for table in tables:
    print(f"  - {table[0]}")

# day_mission 관련 테이블 찾기
for table in tables:
    if 'mission' in table[0].lower() or 'day' in table[0].lower():
        print(f"\n{table[0]} 구조:")
        cursor.execute(f"PRAGMA table_info({table[0]});")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  {col[1]}: {col[2]}")
