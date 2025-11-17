import sqlite3
from datetime import date

db = sqlite3.connect('zero_waste.db')
cursor = db.cursor()

# users 테이블 확인
cursor.execute('SELECT id, email, name FROM users')
users = cursor.fetchall()

print("Users in database:")
for user in users:
    print(f"  ID: {user[0]}, Email: {user[1]}, Name: {user[2]}")

# test@example.com 사용자 확인
cursor.execute('SELECT id FROM users WHERE email = ?', ('test@example.com',))
test_user = cursor.fetchone()

if test_user:
    user_id = test_user[0]
    print(f"\n✓ test@example.com 사용자 ID: {user_id}")
    
    # 오늘의 미션 확인
    today = date.today().isoformat()
    cursor.execute('SELECT * FROM day_missions WHERE user_id = ? AND date = ?', (user_id, today))
    missions = cursor.fetchall()
    print(f"✓ 오늘({today}) 개인 미션 수: {len(missions)}")
else:
    print("\n✗ test@example.com 사용자 없음")

db.close()
