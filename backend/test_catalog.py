import json
import sqlite3

db = sqlite3.connect('zero_waste.db')
cursor = db.cursor()

# catalog_missions 테이블 확인
cursor.execute('SELECT id, category, submissions FROM catalog_missions LIMIT 3')
rows = cursor.fetchall()

print("catalog_missions 테이블 데이터:")
for row in rows:
    mission_id, category, submissions_str = row
    try:
        submissions = json.loads(submissions_str)
        print(f"\nID: {mission_id}")
        print(f"Category: {category}")
        print(f"Submissions: {submissions}")
    except json.JSONDecodeError as e:
        print(f"JSON 파싱 에러: {e}")
        print(f"Raw submissions: {submissions_str}")

db.close()
