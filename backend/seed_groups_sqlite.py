# backend/seed_groups_sqlite.py
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "zero_waste.db")

print("DB path:", DB_PATH)
conn = sqlite3.connect(DB_PATH)
conn.execute("PRAGMA foreign_keys = ON;")
cur = conn.cursor()

# Ensure users table exists
try:
    cur.execute("SELECT id FROM users WHERE email = ?", ("test@example.com",))
    row = cur.fetchone()
    if row:
        user_id = row[0]
        print("Existing test user id=", user_id)
    else:
        print("Creating test user...")
        cur.execute(
            "INSERT INTO users (email, password_hash, name, profile_color, bio, created_at) VALUES (?,?,?,?,?,?)",
            ("test@example.com", "", "테스트 사용자", "bg-green-300", "테스트 계정입니다", datetime.utcnow().isoformat()),
        )
        conn.commit()
        user_id = cur.lastrowid
        print("Created test user id=", user_id)
except Exception as e:
    print("Error checking/creating test user:", e)
    conn.close()
    raise

# Check existing groups
try:
    cur.execute("SELECT id, name FROM group_missions")
    existing = cur.fetchall()
    if existing:
        print("Group missions already exist:")
        for g in existing:
            print(f"- id={g[0]}, name={g[1]}")
    else:
        print("No group missions found. Inserting sample groups...")
        groups = [
            ("제로웨이스트 챌린지 1팀", "#A3E635", user_id),
            ("텀블러 챌린지", "#22C55E", user_id),
            ("비건 런치 모임", "#4ADE80", user_id),
        ]
        for name, color, created_by in groups:
            cur.execute("INSERT INTO group_missions (name, color, created_by) VALUES (?,?,?)", (name, color, created_by))
        conn.commit()
        cur.execute("SELECT id, name FROM group_missions")
        inserted = cur.fetchall()
        print("Inserted groups:")
        for g in inserted:
            print(f"- id={g[0]}, name={g[1]}")
except Exception as e:
    print("Error checking/inserting groups:", e)
    conn.rollback()
finally:
    conn.close()
print("Done.")
