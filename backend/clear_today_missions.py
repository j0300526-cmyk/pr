import sqlite3
from datetime import date

db = sqlite3.connect('zero_waste.db')
cursor = db.cursor()

today = date.today().isoformat()
cursor.execute('DELETE FROM day_missions WHERE date = ?', (today,))
db.commit()
print(f'✓ 오늘({today}) 날짜의 개인 미션 모두 삭제 완료')
db.close()
