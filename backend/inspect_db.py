import sqlite3
import os
DB_PATH = os.path.join(os.path.dirname(__file__), 'zero_waste.db')
print('Using DB:', DB_PATH)
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

print('\n-- group_missions --')
for row in cur.execute('SELECT id, name, color, created_by FROM group_missions'):
    print(row)

print('\n-- group_members (raw) --')
for row in cur.execute('SELECT id, group_mission_id, user_id, joined_at FROM group_members'):
    print(row)

print('\n-- group counts and member names --')
for gm in cur.execute('SELECT id, name FROM group_missions'):
    gid, gname = gm
    cur.execute('SELECT COUNT(*) FROM group_members WHERE group_mission_id = ?', (gid,))
    cnt = cur.fetchone()[0]
    cur.execute('SELECT u.id, u.name FROM group_members m JOIN users u ON m.user_id = u.id WHERE m.group_mission_id = ?', (gid,))
    members = cur.fetchall()
    print(f'id={gid}, name={gname}, members_count={cnt}, members={members}')

conn.close()
