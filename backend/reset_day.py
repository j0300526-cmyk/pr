import sqlite3
from datetime import date

db = sqlite3.connect('zero_waste.db')
cursor = db.cursor()

today = date.today().isoformat()

# 오늘 날짜의 모든 개인 미션 삭제
deleted_count = 0
cursor.execute('DELETE FROM day_missions WHERE date = ?', (today,))
deleted_count = cursor.rowcount
db.commit()

print(f'✓ 오늘({today}) 날짜의 {deleted_count}개 개인 미션 삭제 완료')
db.close()
