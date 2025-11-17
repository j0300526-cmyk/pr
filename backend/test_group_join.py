# backend/test_group_join.py
from database import SessionLocal
from models import GroupMission, GroupMember


def print_group_status():
    db = SessionLocal()
    try:
        groups = db.query(GroupMission).all()
        print("=== 그룹 현황 ===")
        for g in groups:
            member_count = db.query(GroupMember).filter(GroupMember.group_mission_id == g.id).count()
            print(f"id={g.id}, name={g.name}, members={member_count}")
    finally:
        db.close()


if __name__ == "__main__":
    print_group_status()
